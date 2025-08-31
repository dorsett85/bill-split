export type BillData = {
  id: number;
  business_name?: string;
  business_location?: string;
  gratuity?: number;
  image_path: string;
  image_status: 'parsing' | 'ready' | 'error';
  name?: string;
  tax?: number;
};
