import { Schema, model } from 'mongoose';

export interface ICounter {
  _id: string; // e.g. "PO_2026", "CH_2026", "INV_2026"
  seq: number;
}

export const CounterSchema = new Schema<ICounter>(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0, required: true },
  },
  { timestamps: true }
);

export const CounterModel = model<ICounter>('Counter', CounterSchema);
export default CounterModel;
