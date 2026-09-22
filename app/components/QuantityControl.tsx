import { Minus, Plus } from "lucide-react";
import { useCustomerLanguage } from "./CustomerLanguageProvider";

type Props = { quantity: number; label: string; onAdd: () => void; onRemove: () => void };

export default function QuantityControl({ quantity, label, onAdd, onRemove }: Props) {
  const { t } = useCustomerLanguage();
  return <div className="flex h-10 min-w-[92px] items-center justify-between overflow-hidden rounded-xl bg-[#087443] text-white shadow-sm">
    <button type="button" aria-label={`${t('Remove one')}: ${label}`} onClick={onRemove} className="grid h-full min-w-9 place-items-center active:bg-black/20"><Minus size={16}/></button>
    <span className="min-w-5 text-center text-sm font-black" aria-live="polite">{quantity}</span>
    <button type="button" aria-label={`${t('Add one')}: ${label}`} onClick={onAdd} className="grid h-full min-w-9 place-items-center active:bg-black/20"><Plus size={16}/></button>
  </div>;
}
