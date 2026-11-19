import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMenuItem {
  title: string;
  url: string;
  linkType: 'CUSTOM' | 'CATEGORY' | 'BRAND' | 'PAGE' | 'CAMPAIGN';
  referenceId?: string;
  badge?: string;
  icon?: string;
  displayOrder: number;
  openInNewTab: boolean;
  children?: IMenuItem[];
}

export interface INavigationMenu extends Document {
  organizationId: Types.ObjectId;
  menuCode: string;
  name: string;
  position: 'HEADER_MAIN' | 'HEADER_TOP' | 'FOOTER_QUICK' | 'FOOTER_POLICIES' | 'MOBILE_DRAWER' | 'CATEGORY_SIDEBAR';
  items: IMenuItem[];
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    linkType: {
      type: String,
      enum: ['CUSTOM', 'CATEGORY', 'BRAND', 'PAGE', 'CAMPAIGN'],
      default: 'CUSTOM',
    },
    referenceId: { type: String },
    badge: { type: String },
    icon: { type: String },
    displayOrder: { type: Number, default: 0 },
    openInNewTab: { type: Boolean, default: false },
    children: [{ type: Schema.Types.Mixed }],
  },
  { _id: false }
);

const NavigationMenuSchema = new Schema<INavigationMenu>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    menuCode: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    position: {
      type: String,
      required: true,
      enum: ['HEADER_MAIN', 'HEADER_TOP', 'FOOTER_QUICK', 'FOOTER_POLICIES', 'MOBILE_DRAWER', 'CATEGORY_SIDEBAR'],
      index: true,
    },
    items: [MenuItemSchema],
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

NavigationMenuSchema.index({ organizationId: 1, position: 1, isActive: 1 });

export const NavigationMenuModel = mongoose.model<INavigationMenu>('NavigationMenu', NavigationMenuSchema);
export default NavigationMenuModel;
