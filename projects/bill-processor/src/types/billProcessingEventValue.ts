/**
 * Parsed object from the Kafka event value property
 */
export interface BillProcessingEventValue {
  /** ID of the bill that the image is associated with **/
  billId: number;
  /** Name of the image that needs text analysis **/
  imageName: string;
}
