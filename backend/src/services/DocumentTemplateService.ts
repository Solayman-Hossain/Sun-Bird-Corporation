import { Types } from 'mongoose';
import { DocumentTemplateModel, IDocumentTemplate, DocumentTypeEnum } from '../models/DocumentTemplate';
import { NotFoundError, ValidationError } from '../errors/AppError';
import logger from '../config/logger';

export class DocumentTemplateService {
  /**
   * Creates a new document template configuration
   */
  public static async createTemplate(
    data: Partial<IDocumentTemplate>,
    userId: string | Types.ObjectId
  ): Promise<IDocumentTemplate> {
    if (!data.name || !data.documentType || !data.organizationId) {
      throw new ValidationError('Name, documentType, and organizationId are required');
    }

    if (data.isDefault) {
      // Clear previous default for this org + docType
      await DocumentTemplateModel.updateMany(
        {
          organizationId: data.organizationId,
          documentType: data.documentType,
        },
        { isDefault: false }
      );
    }

    const template = new DocumentTemplateModel({
      ...data,
      createdBy: new Types.ObjectId(userId),
    });

    await template.save();
    logger.info(`Template '${template.name}' (${template.documentType}) created`);
    return template;
  }

  /**
   * Updates an existing document template
   */
  public static async updateTemplate(
    id: string | Types.ObjectId,
    data: Partial<IDocumentTemplate>,
    userId: string | Types.ObjectId
  ): Promise<IDocumentTemplate> {
    const template = await DocumentTemplateModel.findById(id);
    if (!template) {
      throw new NotFoundError(`Template not found with ID ${id}`);
    }

    if (data.isDefault) {
      await DocumentTemplateModel.updateMany(
        {
          organizationId: template.organizationId,
          documentType: template.documentType,
          _id: { $ne: template._id },
        },
        { isDefault: false }
      );
    }

    Object.assign(template, data);
    template.version = (template.version || 1) + 1;
    await template.save();

    logger.info(`Template '${template.name}' updated to version ${template.version}`);
    return template;
  }

  /**
   * Lists templates with filtering
   */
  public static async getTemplates(filters: {
    organizationId?: string | Types.ObjectId;
    documentType?: DocumentTypeEnum;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filters.limit) || 20));
    const skip = (page - 1) * limit;

    const query: any = {};
    if (filters.organizationId) query.organizationId = new Types.ObjectId(filters.organizationId);
    if (filters.documentType) query.documentType = filters.documentType;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.search) {
      query.name = new RegExp(filters.search.trim(), 'i');
    }

    const [items, total] = await Promise.all([
      DocumentTemplateModel.find(query)
        .populate('organizationId', 'displayName legalName organizationCode')
        .sort({ isDefault: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DocumentTemplateModel.countDocuments(query),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  public static async getTemplateById(id: string | Types.ObjectId): Promise<IDocumentTemplate> {
    const template = await DocumentTemplateModel.findById(id).populate('organizationId');
    if (!template) {
      throw new NotFoundError(`Template not found with ID ${id}`);
    }
    return template;
  }

  public static async duplicateTemplate(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId
  ): Promise<IDocumentTemplate> {
    const source = await DocumentTemplateModel.findById(id).lean();
    if (!source) {
      throw new NotFoundError(`Source template not found with ID ${id}`);
    }

    const { _id, createdAt, updatedAt, ...rest } = source;
    const duplicated = new DocumentTemplateModel({
      ...rest,
      name: `${source.name} (Copy)`,
      isDefault: false,
      version: 1,
      createdBy: new Types.ObjectId(userId),
    });

    await duplicated.save();
    return duplicated;
  }

  public static async setDefaultTemplate(
    id: string | Types.ObjectId,
    organizationId: string | Types.ObjectId,
    documentType: DocumentTypeEnum
  ): Promise<IDocumentTemplate> {
    const template = await DocumentTemplateModel.findById(id);
    if (!template) {
      throw new NotFoundError(`Template not found with ID ${id}`);
    }

    await DocumentTemplateModel.updateMany(
      { organizationId, documentType },
      { isDefault: false }
    );

    template.isDefault = true;
    await template.save();
    return template;
  }

  public static async deleteTemplate(id: string | Types.ObjectId): Promise<void> {
    const template = await DocumentTemplateModel.findById(id);
    if (!template) {
      throw new NotFoundError(`Template not found with ID ${id}`);
    }
    if (template.isDefault) {
      throw new ValidationError('Cannot delete the default template. Set another default first.');
    }
    await DocumentTemplateModel.findByIdAndDelete(id);
  }

  /**
   * Seeds production-ready standard templates for an organization
   */
  public static async seedDefaultTemplates(
    organizationId: string | Types.ObjectId,
    userId: string | Types.ObjectId
  ) {
    const orgId = new Types.ObjectId(organizationId);
    const uId = new Types.ObjectId(userId);

    const count = await DocumentTemplateModel.countDocuments({ organizationId: orgId });
    if (count > 0) {
      return { seeded: false, message: 'Templates already exist for this organization' };
    }

    // 1. Purchase Order Reference Template (Matches Part 13 specifications)
    const poTemplate = new DocumentTemplateModel({
      organizationId: orgId,
      name: 'Standard Purchase Order Template (Sun Bird)',
      documentType: 'PURCHASE_ORDER',
      language: 'BILINGUAL',
      version: 1,
      paperSize: 'A4',
      orientation: 'PORTRAIT',
      headerSettings: {
        showLogo: true,
        logoPosition: 'left',
        showOrgDetails: true,
        showDocNumber: true,
        showStatus: true,
        docTitle: 'PURCHASE ORDER',
        docSubtitle: 'Sun Bird Corporation Medical Supplies & Instruments',
      },
      recipientSettings: {
        showRecipient: true,
        recipientLabel: 'Vendor / Supplier',
        showAddress: true,
        showContact: true,
        showBinVat: true,
      },
      introductionText:
        'Dear Sir/Madam,\nWe are pleased to place this Purchase Order with your esteemed company for the supply of the goods specified herein, subject to the terms and conditions stated below.\nKindly confirm receipt of this Purchase Order and arrange delivery of the goods within the agreed delivery schedule.',
      closingText: 'Thank you for your prompt cooperation and partnership.',
      tableDefinition: {
        columns: [
          { id: 'sl', label: 'SL', field: 'sl', width: '45px', align: 'center', format: 'auto_sl', visible: true, isDeletable: false },
          { id: 'item', label: 'Item Description', field: 'productName', width: 'auto', align: 'left', format: 'text', visible: true, isDeletable: false },
          { id: 'brand', label: 'Brand', field: 'brand', width: '90px', align: 'center', format: 'text', visible: true, isDeletable: true },
          { id: 'origin', label: 'Origin', field: 'origin', width: '90px', align: 'center', format: 'text', visible: true, isDeletable: true },
          { id: 'unit', label: 'Unit', field: 'uom', width: '70px', align: 'center', format: 'text', visible: true, isDeletable: true },
          { id: 'qty', label: 'Qty', field: 'quantity', width: '75px', align: 'right', format: 'number', visible: true, isDeletable: false },
          { id: 'unitPrice', label: 'Unit Price', field: 'unitPrice', width: '100px', align: 'right', format: 'currency', visible: true, isDeletable: false },
          { id: 'total', label: 'Total (BDT)', field: 'lineTotal', width: '110px', align: 'right', format: 'currency', visible: true, isDeletable: false },
        ],
        showSubtotal: true,
        showDiscount: true,
        showTax: true,
        showGrandTotal: true,
        showAmountInWords: true,
        amountInWordsLanguage: 'EN',
      },
      termsAndConditions: [
        { id: 't1', textBn: '১. সরবরাহকৃত পণ্য অবশ্যই গুণগত মানসম্পন্ন এবং প্রস্তুতকারকের আসল সিলযুক্ত হতে হবে।', order: 1, isActive: true },
        { id: 't2', textBn: '২. চালানের সাথে মূসক-৬.৩ এবং ওয়ারেন্টি কার্ড প্রদান করতে হবে।', order: 2, isActive: true },
        { id: 't3', textBn: '৩. নির্ধারিত সময়ের মধ্যে পণ্য সরবরাহে ব্যর্থ হলে ক্রয় আদেশ বাতিল করার অধিকার কর্তৃপক্ষ সংরক্ষণ করে।', order: 3, isActive: true },
        { id: 't4', textBn: '৪. ত্রুটিপূর্ণ বা ক্ষতিগ্রস্ত পণ্য সরবরাহকারীর নিজস্ব খরচে ফেরত/বদল করে দিতে হবে।', order: 4, isActive: true },
      ],
      signatureSettings: [
        {
          id: 'sig-proc',
          title: 'Authorized Procurement Signature',
          personName: 'Head of Procurement',
          designation: 'Procurement Department',
          alignment: 'left',
          required: true,
        },
        {
          id: 'sig-vendor',
          title: 'Vendor Acknowledgement',
          personName: 'Authorized Representative',
          designation: 'Supplier Acceptance & Seal',
          alignment: 'right',
          required: true,
        },
      ],
      sealSettings: {
        showSeal: true,
        stampType: 'OFFICIAL',
        position: 'right',
      },
      footerSettings: {
        footerText: 'Sun Bird Corporation — Quality Healthcare Instruments & Consumables Provider',
        showPageNumber: true,
        pageNumberFormat: 'Page {page} of {pages}',
      },
      isDefault: true,
      isActive: true,
      createdBy: uId,
    });

    // 2. Sales Quotation Template (Somorita Hospital preset)
    const quoTemplate = new DocumentTemplateModel({
      organizationId: orgId,
      name: 'Standard Price Quotation (Hospital & Clinic)',
      documentType: 'SALES_QUOTATION',
      language: 'BILINGUAL',
      version: 1,
      paperSize: 'A4',
      orientation: 'PORTRAIT',
      headerSettings: {
        showLogo: true,
        logoPosition: 'left',
        showOrgDetails: true,
        showDocNumber: true,
        showStatus: true,
        docTitle: 'PRICE QUOTATION',
        docSubtitle: 'All Kinds of Medical Equipment & Hospital Supplier',
      },
      recipientSettings: {
        showRecipient: true,
        recipientLabel: 'Recipient / Hospital Authority',
        showAddress: true,
        showContact: true,
        showBinVat: true,
      },
      introductionText:
        'Dear Sir/Madam,\nWe are supplying medical diagnostic and surgical consumables to various hospitals across Bangladesh. We are pleased to submit our most competitive price quotation for your kind review and consideration:-',
      closingText: 'We look forward to receiving your valued work order.',
      tableDefinition: {
        columns: [
          { id: 'sl', label: 'Sl No', field: 'sl', width: '50px', align: 'center', format: 'auto_sl', visible: true, isDeletable: false },
          { id: 'sku', label: 'Code No', field: 'sku', width: '80px', align: 'center', format: 'text', visible: true, isDeletable: true },
          { id: 'name', label: 'Name of items', field: 'productName', width: 'auto', align: 'left', format: 'text', visible: true, isDeletable: false },
          { id: 'origin', label: 'Country of Origin', field: 'origin', width: '110px', align: 'center', format: 'text', visible: true, isDeletable: true },
          { id: 'unit', label: 'Unit/Box', field: 'uom', width: '80px', align: 'center', format: 'text', visible: true, isDeletable: true },
          { id: 'rate', label: 'Unit Price in Tk.', field: 'unitPrice', width: '110px', align: 'right', format: 'currency', visible: true, isDeletable: false },
        ],
        showSubtotal: true,
        showDiscount: true,
        showTax: true,
        showGrandTotal: true,
        showAmountInWords: true,
        amountInWordsLanguage: 'EN',
      },
      termsAndConditions: [
        { id: 'tq1', textBn: '১. উদ্ধৃত মূল্যে ভ্যাট এবং ট্যাক্স অন্তর্ভুক্ত (শর্ত প্রযোজ্য)।', order: 1, isActive: true },
        { id: 'tq2', textBn: '২. কোটেশনের মেয়াদ পত্র জারির তারিখ হতে ৩০ (ত্রিশ) দিন পর্যন্ত কার্যকর থাকিবে।', order: 2, isActive: true },
        { id: 'tq3', textBn: '৩. ঢাকা শহরের ভেতরে ফ্রি হোম ডেলিভারি সুবিধা প্রদান করা হবে।', order: 3, isActive: true },
      ],
      signatureSettings: [
        {
          id: 'sig-sales',
          title: 'Authorized Sales Signatory',
          personName: 'Chief Operating Officer',
          designation: 'Sun Bird Corporation',
          alignment: 'right',
          required: true,
        },
      ],
      sealSettings: {
        showSeal: true,
        stampType: 'OFFICIAL',
        position: 'right',
      },
      footerSettings: {
        footerText: 'Sun Bird Corporation — Licensed DGDA Importer & National Healthcare Distributor',
        showPageNumber: true,
      },
      isDefault: true,
      isActive: true,
      createdBy: uId,
    });

    // 3. Sales Invoice Template (Mushak-6.3 Tax Invoice)
    const invTemplate = new DocumentTemplateModel({
      organizationId: orgId,
      name: 'Mushak-6.3 Statutory Tax Invoice',
      documentType: 'SALES_INVOICE',
      language: 'BILINGUAL',
      version: 1,
      paperSize: 'A4',
      orientation: 'PORTRAIT',
      headerSettings: {
        showLogo: true,
        logoPosition: 'left',
        showOrgDetails: true,
        showDocNumber: true,
        showStatus: true,
        docTitle: 'কর চালানপত্র (মূসক-৬.৩)',
        docSubtitle: '[বিধি ৪০ এর উপ-বিধি (১) এর দফা (গ) ও দফা (চ) দ্রষ্টব্য]',
      },
      recipientSettings: {
        showRecipient: true,
        recipientLabel: 'ক্রেতার বিবরণী / Customer Details',
        showAddress: true,
        showContact: true,
        showBinVat: true,
      },
      tableDefinition: {
        columns: [
          { id: 'sl', label: 'ক্রমিক', field: 'sl', width: '50px', align: 'center', format: 'auto_sl', visible: true, isDeletable: false },
          { id: 'item', label: 'পণ্য বা সেবার বর্ণনা', field: 'productName', width: 'auto', align: 'left', format: 'text', visible: true, isDeletable: false },
          { id: 'uom', label: 'সরবরাহের একক', field: 'uom', width: '90px', align: 'center', format: 'text', visible: true, isDeletable: true },
          { id: 'qty', label: 'পরিমাণ', field: 'quantity', width: '80px', align: 'right', format: 'number', visible: true, isDeletable: false },
          { id: 'rate', label: 'একক মূল্য (টাকা)', field: 'unitPrice', width: '110px', align: 'right', format: 'currency', visible: true, isDeletable: false },
          { id: 'total', label: 'মোট মূল্য (টাকা)', field: 'lineTotal', width: '120px', align: 'right', format: 'currency', visible: true, isDeletable: false },
        ],
        showSubtotal: true,
        showDiscount: true,
        showTax: true,
        showGrandTotal: true,
        showAmountInWords: true,
        amountInWordsLanguage: 'BN',
      },
      termsAndConditions: [
        { id: 'ti1', textBn: '১. পণ্য গ্রহণের সময় চালান ও পণ্য গণনা করে বুঝে নিন।', order: 1, isActive: true },
        { id: 'ti2', textBn: '২. চালানের তারিখ হতে ১৫ দিনের মধ্যে বিল পরিশোধযোগ্য।', order: 2, isActive: true },
      ],
      signatureSettings: [
        {
          id: 'sig-inv',
          title: 'ক্ষমতাপ্রাপ্ত কর্মকর্তার স্বাক্ষর ও সিল',
          personName: 'Finance & Accounts',
          designation: 'Sun Bird Corporation',
          alignment: 'right',
          required: true,
        },
      ],
      sealSettings: {
        showSeal: true,
        stampType: 'OFFICIAL',
        position: 'right',
      },
      footerSettings: {
        footerText: 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার — জাতীয় রাজস্ব বোর্ড',
        showPageNumber: true,
      },
      isDefault: true,
      isActive: true,
      createdBy: uId,
    });

    // 4. Money Receipt Template
    const mrTemplate = new DocumentTemplateModel({
      organizationId: orgId,
      name: 'Official Money Receipt',
      documentType: 'MONEY_RECEIPT',
      language: 'BILINGUAL',
      version: 1,
      paperSize: 'A5',
      orientation: 'LANDSCAPE',
      headerSettings: {
        showLogo: true,
        logoPosition: 'left',
        showOrgDetails: true,
        showDocNumber: true,
        showStatus: true,
        docTitle: 'MONEY RECEIPT (অর্থ প্রাপ্তি রশিদ)',
      },
      recipientSettings: {
        showRecipient: true,
        recipientLabel: 'Received with thanks from (টাকা গৃহীত হইল)',
        showAddress: true,
        showContact: true,
        showBinVat: false,
      },
      tableDefinition: {
        columns: [
          { id: 'sl', label: 'SL', field: 'sl', width: '50px', align: 'center', format: 'auto_sl', visible: true, isDeletable: false },
          { id: 'desc', label: 'Particulars / Against Invoice', field: 'productName', width: 'auto', align: 'left', format: 'text', visible: true, isDeletable: false },
          { id: 'amount', label: 'Amount (BDT)', field: 'lineTotal', width: '140px', align: 'right', format: 'currency', visible: true, isDeletable: false },
        ],
        showSubtotal: false,
        showDiscount: false,
        showTax: false,
        showGrandTotal: true,
        showAmountInWords: true,
        amountInWordsLanguage: 'BILINGUAL',
      },
      termsAndConditions: [
        { id: 'tm1', textBn: 'চেক বা পে-অর্ডার দ্বারা পরিশোধকৃত অর্থ ব্যাংক হিসাবে জমা হওয়ার পর এই রশিদ কার্যকর হইবে।', order: 1, isActive: true },
      ],
      signatureSettings: [
        {
          id: 'sig-mr-auth',
          title: 'Authorized Signature & Stamp',
          personName: 'Cashier / Accountant',
          alignment: 'right',
          required: true,
        },
      ],
      sealSettings: {
        showSeal: true,
        stampType: 'PAID',
        position: 'left',
      },
      footerSettings: {
        footerText: 'This is a computer generated official money receipt.',
        showPageNumber: false,
      },
      isDefault: true,
      isActive: true,
      createdBy: uId,
    });

    await Promise.all([poTemplate.save(), quoTemplate.save(), invTemplate.save(), mrTemplate.save()]);

    return {
      seeded: true,
      templatesCount: 4,
      message: 'Default document templates seeded successfully',
    };
  }
}

export default DocumentTemplateService;
