// utils/priceCalculator.js

// 材料类型配置
export const MATERIAL_TYPES = {
    whiteCard: {
      name: '白卡',
      types: [
        { weight: 250, price: 6500 },
        { weight: 300, price: 7800 },
        { weight: 350, price: 9100 }
      ]
    },
    greyCard: {
      name: '灰板',
      types: [
        { weight: 800, price: 3200 },
        { weight: 900, price: 3600 },
        { weight: 1000, price: 4000 }
      ]
    },
    corrugatedE: {
      name: 'E瓦',
      types: [
        { weight: 0, price: 3500 }
      ]
    },
    corrugatedF: {
      name: 'F瓦',
      types: [
        { weight: 0, price: 3800 }
      ]
    }
  };
  
  // 对裱组合配置
  export const MOUNTING_COMBINATIONS = {
    whiteToWhite: { name: '白卡对白卡', price: 0.15 },
    whiteToGrey: { name: '白卡对灰板', price: 0.12 },
    whiteToCorrugatedE: { name: '白卡对E瓦', price: 0.18 },
    whiteToCorrugatedF: { name: '白卡对F瓦', price: 0.20 }
  };
  
  // 印刷价格配置
  export const PRINTING_PRICES = {
    duikaiFourColor: { 
      name: '对开四色', 
      setupFee: 300,
      pricePerThousand: 70,
      size: { length: 885, width: 595 }
    },
    duikaiOneSpot: { 
      name: '对开专色', 
      setupFee: 350,
      pricePerThousand: 80,
      size: { length: 885, width: 595 }
    },
    duikaiFourColorTwoSpot: { 
      name: '对开4C+2专色', 
      setupFee: 500,
      pricePerThousand: 100,
      size: { length: 885, width: 595 }
    },
    duikaiFourColorFourSpot: { 
      name: '对开4C+4专色', 
      setupFee: 600,
      pricePerThousand: 120,
      size: { length: 885, width: 595 }
    },
    duikaiMetallicSpot: { 
      name: '对开专色(金银黑等)', 
      setupFee: 480,
      pricePerThousand: 145,
      size: { length: 885, width: 595 }
    },
    xiaoQuankaiFourColor: { 
      name: '小全开四色', 
      setupFee: 450,
      pricePerThousand: 80,
      size: { length: 900, width: 600 }
    },
    xiaoQuankaiFourColorTwoSpot: { 
      name: '小全开4C+2专色', 
      setupFee: 600,
      pricePerThousand: 120,
      size: { length: 900, width: 600 }
    },
    xiaoQuankaiFourColorFourSpot: { 
      name: '小全开4C+4专色', 
      setupFee: 800,
      pricePerThousand: 160,
      size: { length: 900, width: 600 }
    },
    xiaoQuankaiMetallicSpot: { 
      name: '小全开专色(金银黑等)', 
      setupFee: 600,
      pricePerThousand: 180,
      size: { length: 900, width: 600 }
    }
  };
  
  // 覆膜类型配置
  export const LAMINATION_TYPES = {
    matte: { name: '哑膜', price: 0.15 },
    glossy: { name: '光膜', price: 0.12 }
  };
  
  // 利润率阶梯配置
  const PROFIT_RATE_TIERS = [
    { min: 0, max: 1000, rate: 0.30 },     // 1-1000个，30%利润率
    { min: 1001, max: 3000, rate: 0.25 },  // 1001-3000个，25%利润率
    { min: 3001, max: 5000, rate: 0.20 },  // 3001-5000个，20%利润率
    { min: 5001, max: 10000, rate: 0.15 }, // 5001-10000个，15%利润率
    { min: 10001, max: Infinity, rate: 0.10 } // 10001及以上，10%利润率
  ];
  
  // 计算利润率的函数
  const calculateProfitRate = (quantity) => {
    const tier = PROFIT_RATE_TIERS.find(
      tier => quantity >= tier.min && quantity <= tier.max
    );
    return tier ? 1 + tier.rate : 1.3; // 如果没找到匹配的区间，默认30%
  };
  
  // 计算印刷费用的函数
  const calculatePrintingCost = (printingType, quantity) => {
    const printingInfo = PRINTING_PRICES[printingType];
    if (!printingInfo) return 0;
    
    // 开机费
    const setupFee = printingInfo.setupFee;
    
    // 如果数量不超过1000，只收开机费
    if (quantity <= 1000) {
      return setupFee;
    }
    
    // 超过1000的部分，按每千张计费
    const additionalThousands = Math.ceil((quantity - 1000) / 1000);
    const additionalCost = additionalThousands * printingInfo.pricePerThousand;
    
    return setupFee + additionalCost;
  };
  
  // 烫金位置类
  export class EmbossPosition {
    constructor(length, width, setupFee) {
      this.length = length;
      this.width = width;
      this.setupFee = setupFee;
      this.area = (length * width) / 10000; // 转换为平方米
    }
  
    calculateCost(quantity) {
      const processCost = this.area * quantity * 0.8; // 每平方米0.8元
      return {
        processCost,
        setupFee: this.setupFee,
        total: processCost + this.setupFee
      };
    }
  }
  
  // 计算总成本函数
  export const calculateTotalCost = ({
    quantity,
    materialCost,
    printingType,
    embossPositions,
    uvCost,
    mountingCost,
    dieCuttingCost,
    dieCuttingMoldCost,
    laminationType,
    laminationArea,
    oilType,
    oilCost,
    bondingRequired
  }) => {
    // 计算印刷费用
    const printingCost = calculatePrintingCost(printingType, quantity);
  
    // 计算烫金总成本
    const embossCost = embossPositions.reduce((total, pos) => {
      const cost = pos.calculateCost(quantity);
      return {
        processCost: (total.processCost || 0) + cost.processCost,
        setupFee: (total.setupFee || 0) + cost.setupFee,
        total: (total.total || 0) + cost.total
      };
    }, {});
  
    // 计算覆膜成本
    const laminationCost = laminationType 
      ? LAMINATION_TYPES[laminationType].price * laminationArea * quantity
      : 0;
  
    // 计算粘和成本
    const bondingCost = bondingRequired ? quantity * 0.1 : 0;
  
    // 计算基础成本
    const baseCost = materialCost + 
                     printingCost + 
                     (embossCost.total || 0) + 
                     uvCost +
                     mountingCost +
                     dieCuttingCost +
                     dieCuttingMoldCost +
                     laminationCost +
                     oilCost +
                     bondingCost;
  
    // 计算运费（固定100元）
    const shippingCost = 100;
  
    // 使用新的利润率计算方法
    const profitRate = calculateProfitRate(quantity);
  
    // 计算总成本
    const total = (baseCost * profitRate) + shippingCost;
  
    return {
      materialCost,
      printingCost,
      embossCost,
      uvCost,
      mountingCost,
      dieCuttingCost,
      dieCuttingMoldCost,
      laminationCost,
      oilCost,
      bondingCost,
      shippingCost,
      profitRate,
      total
    };
  };
  
    // 辅助计算函数
    export const calculateArea = (length, width) => {
      return (length * width) / 1000000; // 转换为平方米
    };
  
    export const calculatePaperCount = (quantity, printingType, length, width) => {
      const printingInfo = PRINTING_PRICES[printingType];
      if (!printingInfo) return 0;
    
      const sheetsPerPrint = Math.floor(
        (printingInfo.size.length * printingInfo.size.width) /
        (length * width)
      );
      return Math.ceil(quantity / sheetsPerPrint);
    };