/** Planning milestone only; it does not start a tree drive, spend funds or make a planting promise.
 * Reserved commitments are created only for eligible future deliveries after audited activation.
 */
export const ZESHU_GREEN_BATCH_ORDERS = 10_000;

export function greenBatchProgress(eligibleCommitments: number){
  const total=Number.isSafeInteger(eligibleCommitments)&&eligibleCommitments>0?eligibleCommitments:0;
  const completeBatches=Math.floor(total/ZESHU_GREEN_BATCH_ORDERS);
  const remainder=total%ZESHU_GREEN_BATCH_ORDERS;
  return {
    milestoneOrders:ZESHU_GREEN_BATCH_ORDERS,
    qualifyingOrdersTracked:total,
    completeBatches,
    progressInCurrentBatch:total>0&&remainder===0?ZESHU_GREEN_BATCH_ORDERS:remainder,
    ordersUntilNextMilestone:remainder===0 && total>0?0:ZESHU_GREEN_BATCH_ORDERS-remainder,
    milestoneReached:completeBatches>0,
  };
}
