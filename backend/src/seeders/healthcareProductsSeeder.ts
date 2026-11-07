import { connectDatabase, disconnectDatabase } from '../config/database';
import { ProductModel } from '../models/Product';
import { ProductBatchModel } from '../models/ProductBatch';
import { WarehouseModel } from '../models/Warehouse';
import logger from '../config/logger';

export async function seedHealthcareProducts() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  SUN BIRD CORPORATION — HEALTHCARE & MEDICAL STOREFRONT SEEDER');
  console.log('  (Seeding Master Medical Consumables & Diagnostic Products)');
  console.log('════════════════════════════════════════════════════════════════════════\n');

  await connectDatabase();

  try {
    // 1. Fetch Central Warehouse
    const centralWh = await WarehouseModel.findOne({ warehouseCode: 'WH-DAC-CENTRAL' });
    if (!centralWh) {
      throw new Error('Central Warehouse (WH-DAC-CENTRAL) not found! Run master seeder first.');
    }

    console.log(`Using Warehouse: ${centralWh.name} (${centralWh.warehouseCode})`);

    // 2. Define the exact requested healthcare products
    const healthcareProducts = [
      {
        sku: 'MED-CAN-020G',
        nameEn: 'Sterile IV Cannula 20G with Injection Port & Wings',
        nameBn: 'স্টেরাইল আইভি ক্যানুলা ২০জি (ইনজেকশন পোর্ট ও উইংস সহ)',
        brand: 'Sun Bird Med',
        category: 'Medical Consumables',
        hsCode: '90183900',
        baseUom: 'PCS',
        isMedical: true,
        isExpirable: true,
        minStockQty: 200,
        retailPrice: 45, // BDT Retail MRP for E-Commerce
        showroomPrice: 40,
        resellerTierPrices: [
          { tier: 1 as const, price: 35 },
          { tier: 2 as const, price: 32 },
          { tier: 3 as const, price: 30 },
        ],
        barcodes: ['8941001000018'],
        seoContent: {
          metaTitle: 'Sterile IV Cannula 20G Best Price in Bangladesh | Sun Bird Corp',
          metaDescription: 'High quality sterile IV cannula with injection port and wings. Safe, painless, medical grade imported cannula.',
          descriptionEn: 'High quality surgical-grade sterile IV Cannula (Gauge 20G, Pink) equipped with injection port valve and wings for smooth vascular access and medication administration.',
          descriptionBn: 'উচ্চমানের সার্জিক্যাল গ্রেড স্টেরাইল আইভি ক্যানুলা (২০ গেজ, গোলাপী), যা মসৃণ রক্তনালী সংযোগ ও মেডিসিন প্রয়োগের জন্য অত্যন্ত নিরাপদ ও কার্যকর।',
        },
        batchData: {
          batchNumber: 'BATCH-CAN-2026A',
          category: 'EXPIRY_CONTROLLED' as const,
          manufacturingDate: new Date('2026-01-10'),
          expiryDate: new Date('2029-01-09'),
          currentQty: 2500,
          unitCost: 22,
          warrantyMonths: 0,
          hasIndividualSerials: false,
        },
      },
      {
        sku: 'MED-TRN-001',
        nameEn: 'Medical Elastic Quick-Release Buckle Tourniquet',
        nameBn: 'মেডিকেল ইলাস্টিক কুইক-রিলিজ বাকল টার্নিকেট',
        brand: 'Sun Bird Med',
        category: 'Medical Consumables',
        hsCode: '90189090',
        baseUom: 'PCS',
        isMedical: true,
        isExpirable: false,
        minStockQty: 50,
        retailPrice: 120,
        showroomPrice: 110,
        resellerTierPrices: [
          { tier: 1 as const, price: 95 },
          { tier: 2 as const, price: 90 },
        ],
        barcodes: ['8941001000025'],
        seoContent: {
          metaTitle: 'Medical Quick-Release Elastic Tourniquet | Sun Bird Corp BD',
          metaDescription: 'Durable quick release emergency tourniquet for blood collection and phlebotomy in hospital and diagnostic clinics.',
          descriptionEn: 'Flexible medical elastic band with quick snap-on release buckle for comfortable vein compression during intravenous injections and phlebotomy.',
          descriptionBn: 'রক্ত সংগ্রহ এবং আইভি ইনজেকশন দেওয়ার জন্য সুবিধাজনক কুইক-রিলিজ বাকলযুক্ত ইলাস্টিক টার্নিকেট বেল্ট।',
        },
        batchData: {
          batchNumber: 'BATCH-TRN-2026A',
          category: 'NON_EXPIRING' as const,
          manufacturingDate: new Date('2026-02-01'),
          currentQty: 500,
          unitCost: 55,
          warrantyMonths: 6,
          hasIndividualSerials: false,
        },
      },
      {
        sku: 'MED-ECG-10LD',
        nameEn: '10-Lead Universal Patient ECG Cable & Lead Wires',
        nameBn: '১০-লিড ইউনিভার্সাল ডায়াগনস্টিক ইসিজি ক্যাবল ও লিড ওয়্যার',
        brand: 'Mindray Compatible',
        category: 'Diagnostic Accessories',
        hsCode: '90181100',
        baseUom: 'SET',
        isMedical: true,
        isExpirable: false,
        minStockQty: 10,
        retailPrice: 2800,
        showroomPrice: 2600,
        resellerTierPrices: [
          { tier: 1 as const, price: 2400 },
          { tier: 2 as const, price: 2250 },
        ],
        barcodes: ['8941001000032'],
        seoContent: {
          metaTitle: '10-Lead Universal ECG Cable & Leadwire Set Bangladesh',
          metaDescription: 'High precision 10 lead patient ECG cable with banana pin / snap connectors for all major hospital ECG machines.',
          descriptionEn: 'Premium shielding diagnostic 10-lead ECG cable ensuring artifact-free cardiac signal transmission for 12-lead electrocardiograph machines.',
          descriptionBn: 'হাসপাতাল ও ডায়াগনস্টিক সেন্টারের ১২-লিড ইসিজি মেশিনের জন্য উচ্চমানের নয়েজ-মুক্ত ১০-লিড ইউনিভার্সাল ইসিজি ক্যাবল সেট।',
        },
        batchData: {
          batchNumber: 'BATCH-ECG-2026A',
          category: 'NON_EXPIRING' as const,
          manufacturingDate: new Date('2026-01-15'),
          currentQty: 150,
          unitCost: 1400,
          warrantyMonths: 12,
          hasIndividualSerials: true,
        },
      },
      {
        sku: 'MED-NIV-MSK',
        nameEn: 'Non-Invasive Ventilation (NIV) Full Face CPAP/BiPAP Mask',
        nameBn: 'নন-ইনভেসিভ ভেন্টিলেশন (এনআইভি) ফুল ফেস সিপ্যাপ/বাইপ্যাপ মাস্ক',
        brand: 'ResMed Compatible',
        category: 'Respiratory Care',
        hsCode: '90192000',
        baseUom: 'PCS',
        isMedical: true,
        isExpirable: false,
        minStockQty: 15,
        retailPrice: 3800,
        showroomPrice: 3500,
        resellerTierPrices: [
          { tier: 1 as const, price: 3200 },
          { tier: 2 as const, price: 3000 },
        ],
        barcodes: ['8941001000049'],
        seoContent: {
          metaTitle: 'NIV Full Face CPAP/BiPAP Mask Best Price BD | Sun Bird Corp',
          metaDescription: 'Ergonomic silicone cushion non-invasive ventilation full face mask for ICU patients and home respiratory care.',
          descriptionEn: 'Ultra-soft medical silicone NIV full-face mask with adjustable 4-point headgear and 360-degree elbow rotation for anti-asphyxia CPAP/BiPAP therapy.',
          descriptionBn: 'আইসিইউ ও রেসপিরেটরি কেয়ারের জন্য সিলিকন কুশনযুক্ত নন-ইনভেসিভ ভেন্টিলেশন (NIV) ফুল ফেস মাস্ক, যা নিঃশ্বাস নেওয়া সহজ ও আরামদায়ক করে।',
        },
        batchData: {
          batchNumber: 'BATCH-NIV-2026A',
          category: 'NON_EXPIRING' as const,
          manufacturingDate: new Date('2026-02-10'),
          currentQty: 120,
          unitCost: 1950,
          warrantyMonths: 6,
          hasIndividualSerials: false,
        },
      },
      {
        sku: 'MED-MSH-NEB',
        nameEn: 'Portable Ultrasonic Mesh Nebulizer Machine with Child & Adult Mask',
        nameBn: 'পোর্টেবল আল্ট্রাসনিক মেশ নেবুলাইজার ও সিলিকন মাস্ক সেট',
        brand: 'Feellife Health',
        category: 'Respiratory Care',
        hsCode: '90192000',
        baseUom: 'SET',
        isMedical: true,
        isExpirable: false,
        minStockQty: 25,
        retailPrice: 2200,
        showroomPrice: 2000,
        resellerTierPrices: [
          { tier: 1 as const, price: 1800 },
          { tier: 2 as const, price: 1700 },
        ],
        barcodes: ['8941001000056'],
        seoContent: {
          metaTitle: 'Portable Mesh Nebulizer Machine Price in BD | Silent Inhaler',
          metaDescription: 'Silent handheld vibrating mesh nebulizer machine with adult and pediatric mask, USB rechargeable for asthma relief.',
          descriptionEn: 'Silent microporous vibrating mesh nebulizer producing fine aerosol particles (< 5 microns) for deep lung absorption. Includes USB cable, adult mask, and child mask.',
          descriptionBn: 'শব্দহীন পোর্টেবল মেশ নেবুলাইজার, যা সহজে বহনযোগ্য এবং শিশুদের ও বয়স্কদের হাঁপানি/শ্বাসকষ্ট নিরাময়ে দ্রুত ওষুধ ফুসফুসে পৌঁছে দেয়।',
        },
        batchData: {
          batchNumber: 'BATCH-MSH-2026A',
          category: 'NON_EXPIRING' as const,
          manufacturingDate: new Date('2026-01-20'),
          currentQty: 300,
          unitCost: 1150,
          warrantyMonths: 12,
          hasIndividualSerials: true,
        },
      },
      {
        sku: 'DIAG-GLU-KIT',
        nameEn: 'Digital Blood Glucose Monitoring System with 50 Test Strips & Lancets',
        nameBn: 'ডিজিটাল ব্লাড গ্লুকোজ মনিটরিং মিটার কিট (৫০টি টেস্ট স্ট্রিপ ও ল্যানসেট সহ)',
        brand: 'Accu-Check Safe',
        category: 'Home Diagnostics',
        hsCode: '90278000',
        baseUom: 'KIT',
        isMedical: true,
        isExpirable: true,
        minStockQty: 30,
        retailPrice: 1650,
        showroomPrice: 1500,
        resellerTierPrices: [
          { tier: 1 as const, price: 1350 },
          { tier: 2 as const, price: 1250 },
        ],
        barcodes: ['8941001000063'],
        seoContent: {
          metaTitle: 'Digital Blood Glucose Meter with 50 Strips BD | Diabetes Test Machine',
          metaDescription: 'Fast 5-second blood sugar testing kit with 50 test strips, painless lancing device, memory log, and case.',
          descriptionEn: 'Accurate clinical-grade blood glucose meter delivering results in 5 seconds with tiny 0.5 uL blood sample. Includes 50 test strips, 50 sterile lancets, and lancing pen.',
          descriptionBn: 'মাত্র ৫ সেকেন্ডে সঠিক রক্তের গ্লুকোজ পরিমাপক ডিজিটাল ডায়াবেটিস মিটার কিট। সাথে রয়েছে ৫০টি টেস্ট স্ট্রিপ এবং ল্যানসেট।',
        },
        batchData: {
          batchNumber: 'BATCH-GLU-2026A',
          category: 'EXPIRY_CONTROLLED' as const,
          manufacturingDate: new Date('2026-02-05'),
          expiryDate: new Date('2027-08-04'),
          currentQty: 400,
          unitCost: 880,
          warrantyMonths: 24,
          hasIndividualSerials: true,
        },
      },
      {
        sku: 'MED-BPM-ARM',
        nameEn: 'Fully Automatic Digital Upper Arm Blood Pressure Monitor',
        nameBn: 'ফুল অটোমেটিক ডিজিটাল আপার আর্ম ব্লাড প্রেশার (বিপি) মনিটর',
        brand: 'Omron Compatible',
        category: 'Home Diagnostics',
        hsCode: '90189020',
        baseUom: 'PCS',
        isMedical: true,
        isExpirable: false,
        minStockQty: 20,
        retailPrice: 2750,
        showroomPrice: 2500,
        resellerTierPrices: [
          { tier: 1 as const, price: 2200 },
          { tier: 2 as const, price: 2100 },
        ],
        barcodes: ['8941001000070'],
        seoContent: {
          metaTitle: 'Digital Upper Arm Blood Pressure Monitor Price in Bangladesh',
          metaDescription: 'Automatic digital BP machine with voice broadcast, arrhythmia detection, and large backlit LCD display.',
          descriptionEn: 'Hospital grade digital arm BP monitor featuring Intellisense comfort cuff, irregular heartbeat indicator, and 99-reading dual user memory.',
          descriptionBn: 'নির্ভুল রক্তচাপ ও পালস রেট পরিমাপক ডিজিটাল আপার আর্ম বিপি মেশিন। বড় এলসিডি ডিসপ্লে ও হৃদস্পন্দন অনিয়ম শনাক্তকরণ সুবিধাযুক্ত।',
        },
        batchData: {
          batchNumber: 'BATCH-BPM-2026A',
          category: 'NON_EXPIRING' as const,
          manufacturingDate: new Date('2026-01-25'),
          currentQty: 250,
          unitCost: 1450,
          warrantyMonths: 36,
          hasIndividualSerials: true,
        },
      },
      {
        sku: 'MED-THM-IR01',
        nameEn: 'Non-Contact Infrared Forehead & Body Digital Thermometer',
        nameBn: 'নন-কন্টাক্ট ইনফ্রারেড ডিজিটাল কপাল ও বডি থার্মোমিটার',
        brand: 'Berrcom Medical',
        category: 'Home Diagnostics',
        hsCode: '90251900',
        baseUom: 'PCS',
        isMedical: true,
        isExpirable: false,
        minStockQty: 20,
        retailPrice: 1450,
        showroomPrice: 1300,
        resellerTierPrices: [
          { tier: 1 as const, price: 1100 },
          { tier: 2 as const, price: 1050 },
        ],
        barcodes: ['8941001000087'],
        seoContent: {
          metaTitle: 'Non-Contact Infrared Digital Thermometer Price in Bangladesh',
          metaDescription: '1-second instant fever detection infrared thermometer for babies, adults, and hospitals with 3-color backlit display.',
          descriptionEn: 'Hygienic touchless infrared forehead thermometer offering 1-second temperature measurement with high fever audio-visual alarm and 32 memory recalls.',
          descriptionBn: 'স্পর্শ ছাড়া মাত্র ১ সেকেন্ডে শরীরের নির্ভুল তাপমাত্রা পরিমাপক ইনফ্রারেড থার্মোমিটার। ৩ রঙের ব্যাকলিট ডিসপ্লে ও জ্বর সতর্কবার্তা সহ।',
        },
        batchData: {
          batchNumber: 'BATCH-THM-2026A',
          category: 'NON_EXPIRING' as const,
          manufacturingDate: new Date('2026-02-15'),
          currentQty: 350,
          unitCost: 750,
          warrantyMonths: 12,
          hasIndividualSerials: true,
        },
      },
      {
        sku: 'MED-OXI-FNG',
        nameEn: 'Fingertip Pulse Oximeter with SpO2 & PR Dual-Color OLED Display',
        nameBn: 'ফিঙ্গারটিপ পালস অক্সিমিটার (SpO2 রক্তে অক্সিজেন ও পালস পরিমাপক)',
        brand: 'ChoiceMMed Health',
        category: 'Home Diagnostics',
        hsCode: '90181900',
        baseUom: 'PCS',
        isMedical: true,
        isExpirable: false,
        minStockQty: 25,
        retailPrice: 950,
        showroomPrice: 850,
        resellerTierPrices: [
          { tier: 1 as const, price: 720 },
          { tier: 2 as const, price: 680 },
        ],
        barcodes: ['8941001000094'],
        seoContent: {
          metaTitle: 'Fingertip Pulse Oximeter SpO2 Oxygen Monitor Price in BD',
          metaDescription: 'Fast and accurate blood oxygen saturation and pulse rate monitor with multi-directional OLED display.',
          descriptionEn: 'Instant blood oxygen saturation (SpO2) and heart pulse rate monitor with plethysmograph waveform and automatic shut-off feature.',
          descriptionBn: 'রক্তে অক্সিজেনের মাত্রা এবং পালস রেট নিমিষেই নিখুঁতভাবে মাপার জন্য উচ্চমানের ডিজিটাল ফিঙ্গারটিপ পালস অক্সিমিটার।',
        },
        batchData: {
          batchNumber: 'BATCH-OXI-2026A',
          category: 'NON_EXPIRING' as const,
          manufacturingDate: new Date('2026-01-30'),
          currentQty: 400,
          unitCost: 480,
          warrantyMonths: 12,
          hasIndividualSerials: true,
        },
      },
      {
        sku: 'MED-SWB-ALC',
        nameEn: 'Sterile 70% Isopropyl Alcohol Swab Prep Pads (Box of 100)',
        nameBn: 'স্টেরাইল ৭০% আইসোপ্রোপাইল অ্যালকোহল সোয়াব প্যাড (১০০ পিস বক্স)',
        brand: 'Sun Bird Health',
        category: 'Medical Consumables',
        hsCode: '30059000',
        baseUom: 'BOX',
        isMedical: true,
        isExpirable: true,
        minStockQty: 100,
        retailPrice: 180,
        showroomPrice: 160,
        resellerTierPrices: [
          { tier: 1 as const, price: 135 },
          { tier: 2 as const, price: 125 },
        ],
        barcodes: ['8941001000100'],
        seoContent: {
          metaTitle: 'Sterile Alcohol Swab Prep Pads 100 Pcs Box | Sun Bird Corp',
          metaDescription: 'Antiseptic 70% isopropyl alcohol wipes for skin cleansing prior to injection, cannula, and blood glucose testing.',
          descriptionEn: 'Individually foil-wrapped 2-ply sterile prep pads saturated with 70% isopropyl alcohol for rapid skin antisepsis before injections and diabetic finger pricks.',
          descriptionBn: 'ইনজেকশন, ক্যানুলা ও ডায়াবেটিস পরীক্ষার পূর্বে ত্বক জীবাণুমুক্ত করার জন্য ৭০% আইসোপ্রোপাইল অ্যালকোহল যুক্ত স্টেরাইল সোয়াব প্যাড।',
        },
        batchData: {
          batchNumber: 'BATCH-SWB-2026A',
          category: 'EXPIRY_CONTROLLED' as const,
          manufacturingDate: new Date('2026-02-01'),
          expiryDate: new Date('2029-01-31'),
          currentQty: 1200,
          unitCost: 85,
          warrantyMonths: 0,
          hasIndividualSerials: false,
        },
      },
    ];

    console.log(`\n--- Seeding ${healthcareProducts.length} Target Healthcare Products & Batches ---`);

    for (const p of healthcareProducts) {
      const { batchData, ...productFields } = p;

      // 2.1 Upsert Product
      const product = await ProductModel.findOneAndUpdate(
        { sku: productFields.sku },
        { $set: { ...productFields, isActive: true } },
        { upsert: true, new: true }
      );

      console.log(`✅ Product: [${product.sku}] ${product.nameEn} (MRP: ৳${product.retailPrice})`);

      // 2.2 Upsert Batch with stock in Central Depot
      const batchDoc = {
        productId: product._id,
        sku: product.sku,
        batchNumber: batchData.batchNumber,
        category: batchData.category,
        manufacturingDate: batchData.manufacturingDate,
        expiryDate: (batchData as any).expiryDate,
        baseUom: product.baseUom,
        currentQty: batchData.currentQty,
        reservedQty: 0,
        unitCost: batchData.unitCost,
        hasIndividualSerials: batchData.hasIndividualSerials,
        warrantyMonths: batchData.warrantyMonths,
        warehouseId: centralWh._id,
        locationStatus: 'ON_HAND' as const,
      };

      await ProductBatchModel.findOneAndUpdate(
        { sku: product.sku, batchNumber: batchData.batchNumber, warehouseId: centralWh._id },
        { $set: batchDoc },
        { upsert: true, new: true }
      );

      console.log(`   └─ Batch: [${batchData.batchNumber}] Stock: ${batchData.currentQty} ${product.baseUom} (Unit Cost: ৳${batchData.unitCost})`);
    }

    console.log('\n════════════════════════════════════════════════════════════════════════');
    console.log('  ALL HEALTHCARE PRODUCTS AND INVENTORY BATCHES SUCCESSFULLY PERSISTED!');
    console.log('════════════════════════════════════════════════════════════════════════\n');
  } catch (err: any) {
    logger.error('Error in Healthcare Seeder:', err);
    console.error('❌ Healthcare Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

if (require.main === module) {
  seedHealthcareProducts();
}

export default seedHealthcareProducts;

