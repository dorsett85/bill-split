import { BillProcessingEventValue } from './billProcessingEventValue.ts';

/**
 * Responsible for handling a bill processing event
 */
export interface BillProcessingService {
  process(value: BillProcessingEventValue): Promise<void>;
}
