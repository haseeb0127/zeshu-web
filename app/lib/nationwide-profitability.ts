import 'server-only';

export type FulfillmentSettings = {
  default_min_contribution_rupees: number | string;
  default_min_margin_percent: number | string;
  payment_fee_percent: number | string;
  default_rto_allowance_percent: number | string;
  default_operating_cost_percent: number | string;
  free_shipping_enabled: boolean;
};

export type NationwideLine = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  min_nationwide_quantity: number;
  min_nationwide_order_value: number;
  cost_price: number;
  packaging_cost: number;
  handling_cost: number;
  return_risk_percent: number;
  min_contribution_rupees: number | null;
  min_margin_percent: number | null;
};

export type NationwideProfitabilityResult = {
  eligible: boolean;
  freeShipping: boolean;
  customerShippingCharge: number;
  subtotal: number;
  contribution: number;
  marginPercent: number;
  requiredMinContribution: number;
  requiredMinMarginPercent: number;
  minimumOrderShortfall: number;
  reason: 'OK' | 'MIN_QUANTITY' | 'MIN_ORDER' | 'LOW_MARGIN' | 'INVALID';
  minimumQuantityProduct?: { id: string; name: string; required: number };
};

const number = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const calculateContribution = (
  lines: NationwideLine[],
  settings: FulfillmentSettings,
  courierCost: number,
  customerShippingCharge: number,
) => {
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const productCost = lines.reduce((sum, line) => sum + line.cost_price * line.quantity, 0);
  const packagingCost = lines.reduce((sum, line) => sum + line.packaging_cost * line.quantity, 0);
  const handlingCost = lines.reduce((sum, line) => sum + line.handling_cost * line.quantity, 0);
  const riskAllowance = lines.reduce((sum, line) => {
    const risk = Math.max(number(line.return_risk_percent), number(settings.default_rto_allowance_percent));
    return sum + line.price * line.quantity * risk / 100;
  }, 0);
  const operatingCost = subtotal * number(settings.default_operating_cost_percent) / 100;
  const paymentBase = subtotal + customerShippingCharge;
  const paymentFee = paymentBase * number(settings.payment_fee_percent) / 100;
  const contribution = paymentBase - productCost - packagingCost - handlingCost - courierCost - riskAllowance - operatingCost - paymentFee;
  return {
    subtotal,
    contribution: roundMoney(contribution),
    marginPercent: paymentBase > 0 ? roundMoney(contribution / paymentBase * 100) : -100,
  };
};

export const evaluateNationwideProfitability = (
  lines: NationwideLine[],
  settings: FulfillmentSettings,
  courierCost: number,
): NationwideProfitabilityResult => {
  if (!Array.isArray(lines) || lines.length === 0 || !Number.isFinite(courierCost) || courierCost < 0) {
    return {
      eligible: false, freeShipping: false, customerShippingCharge: 0, subtotal: 0,
      contribution: 0, marginPercent: 0, requiredMinContribution: 0,
      requiredMinMarginPercent: 0, minimumOrderShortfall: 0, reason: 'INVALID',
    };
  }

  const invalidLine = lines.find((line) =>
    !line.id || !line.name || !Number.isFinite(line.price) || line.price < 0
    || !Number.isInteger(line.quantity) || line.quantity <= 0
    || !Number.isFinite(line.cost_price) || line.cost_price < 0
  );
  if (invalidLine) {
    return {
      eligible: false, freeShipping: false, customerShippingCharge: 0, subtotal: 0,
      contribution: 0, marginPercent: 0, requiredMinContribution: 0,
      requiredMinMarginPercent: 0, minimumOrderShortfall: 0, reason: 'INVALID',
    };
  }

  const quantityFailure = lines.find((line) => line.quantity < Math.max(1, number(line.min_nationwide_quantity, 1)));
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const requiredOrderValue = Math.max(0, ...lines.map((line) => number(line.min_nationwide_order_value)));
  const minimumOrderShortfall = roundMoney(Math.max(0, requiredOrderValue - subtotal));
  const requiredMinContribution = Math.max(
    number(settings.default_min_contribution_rupees),
    ...lines.map((line) => line.min_contribution_rupees === null ? 0 : number(line.min_contribution_rupees)),
  );
  const requiredMinMarginPercent = Math.max(
    number(settings.default_min_margin_percent),
    ...lines.map((line) => line.min_margin_percent === null ? 0 : number(line.min_margin_percent)),
  );

  if (quantityFailure) {
    return {
      eligible: false, freeShipping: false, customerShippingCharge: 0, subtotal: roundMoney(subtotal),
      contribution: 0, marginPercent: 0, requiredMinContribution, requiredMinMarginPercent,
      minimumOrderShortfall, reason: 'MIN_QUANTITY',
      minimumQuantityProduct: {
        id: quantityFailure.id,
        name: quantityFailure.name,
        required: Math.max(1, number(quantityFailure.min_nationwide_quantity, 1)),
      },
    };
  }

  if (minimumOrderShortfall > 0) {
    return {
      eligible: false, freeShipping: false, customerShippingCharge: 0, subtotal: roundMoney(subtotal),
      contribution: 0, marginPercent: 0, requiredMinContribution, requiredMinMarginPercent,
      minimumOrderShortfall, reason: 'MIN_ORDER',
    };
  }

  if (settings.free_shipping_enabled) {
    const free = calculateContribution(lines, settings, courierCost, 0);
    if (free.contribution >= requiredMinContribution && free.marginPercent >= requiredMinMarginPercent) {
      return {
        eligible: true, freeShipping: true, customerShippingCharge: 0,
        subtotal: roundMoney(free.subtotal), contribution: free.contribution,
        marginPercent: free.marginPercent, requiredMinContribution, requiredMinMarginPercent,
        minimumOrderShortfall: 0, reason: 'OK',
      };
    }
  }

  const customerShippingCharge = roundMoney(Math.ceil(courierCost));
  const paid = calculateContribution(lines, settings, courierCost, customerShippingCharge);
  const eligible = paid.contribution >= requiredMinContribution && paid.marginPercent >= requiredMinMarginPercent;
  return {
    eligible,
    freeShipping: false,
    customerShippingCharge,
    subtotal: roundMoney(paid.subtotal),
    contribution: paid.contribution,
    marginPercent: paid.marginPercent,
    requiredMinContribution,
    requiredMinMarginPercent,
    minimumOrderShortfall: 0,
    reason: eligible ? 'OK' : 'LOW_MARGIN',
  };
};
