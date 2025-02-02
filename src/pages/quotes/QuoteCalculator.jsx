import { useState } from 'react';
import { 
  MATERIAL_TYPES,
  MOUNTING_COMBINATIONS,
  PRINTING_PRICES,
  LAMINATION_TYPES,
  calculateTotalCost,
  EmbossPosition
} from '../../utils/priceCalculator';

const inputStyle = {
  width: '100%',
  padding: '10px',
  border: '1px solid #d9d9d9',
  borderRadius: '6px',
  fontSize: '14px',
  transition: 'all 0.3s',
  outline: 'none'
};

const labelStyle = {
  display: 'block',
  marginBottom: '8px',
  color: '#333',
  fontSize: '14px',
  fontWeight: '500'
};

const checkboxStyle = {
  marginRight: '8px'
};

function QuoteCalculator() {
  // 基础信息
  const [quantity, setQuantity] = useState(1000);
  const [productLength, setProductLength] = useState(100);
  const [productWidth, setProductWidth] = useState(100);
  
  // 材料选择
  const [materialType, setMaterialType] = useState('whiteCard');
  const [materialWeight, setMaterialWeight] = useState(250);
  
  // 印刷选择
  const [printingType, setPrintingType] = useState('doubleOpenFourColor');
  
  // 烫金位置数组
  const [embossPositions, setEmbossPositions] = useState([
    { id: 1, length: 0, width: 0, setupFee: 0 }
  ]);
  
  // UV工艺
  const [uvCost, setUvCost] = useState(0);
  
  // 对裱选择
  const [mounting, setMounting] = useState({
    required: false,
    combination: 'whiteToWhite',  // 设置默认值
    topWeight: 250,  // 设置默认值
    bottomWeight: 250  // 设置默认值
  });
  
  // 模切信息
  const [dieCutting, setDieCutting] = useState({
    required: false,
    moldCost: 0
  });
  
  // 覆膜选择
  const [lamination, setLamination] = useState({
    required: false,
    type: 'matte'
  });
  
  // 过油选择
  const [oilFinish, setOilFinish] = useState({
    required: false,
    type: 'matte',
    cost: 0
  });
  
  // 粘和工艺
  const [bonding, setBonding] = useState(false);

  // 处理函数
  const addEmbossPosition = () => {
    setEmbossPositions(prev => [
      ...prev,
      { id: Date.now(), length: 0, width: 0, setupFee: 0 }
    ]);
  };

  const updateEmbossPosition = (id, field, value) => {
    setEmbossPositions(prev =>
      prev.map(pos =>
        pos.id === id ? { ...pos, [field]: Number(value) } : pos
      )
    );
  };

  const removeEmbossPosition = (id) => {
    setEmbossPositions(prev => prev.filter(pos => pos.id !== id));
  };

  const calculateMaterialCost = () => {
    const materialInfo = MATERIAL_TYPES[materialType];
    const selectedType = materialInfo.types.find(t => t.weight === materialWeight);
    if (!selectedType) return 0;
  
    // 获取印刷尺寸信息
    const printingInfo = PRINTING_PRICES[printingType];
    if (!printingInfo) return 0;
  
    // 计算每张材料的面积（平方米）
    const materialArea = (printingInfo.size.length * printingInfo.size.width) / 1000000;
    
    // 计算材料价格（元/平方米）
    const pricePerSquareMeter = selectedType.price / 787.5;
    
    // 计算所需张数
    const sheetsNeeded = Math.ceil(quantity / Math.floor((printingInfo.size.length * printingInfo.size.width) / (productLength * productWidth)));
    
    return materialArea * pricePerSquareMeter * sheetsNeeded;
  };

  const calculatePrintingCost = () => {
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

  const calculateMountingCost = () => {
    if (!mounting.required) return 0;
    
    // 获取印刷尺寸信息
    const printingInfo = PRINTING_PRICES[printingType];
    if (!printingInfo) return 0;
    
    // 计算印张数量
    const sheetsPerPrint = Math.floor((printingInfo.size.length * printingInfo.size.width) / (productLength * productWidth));
    const totalSheets = Math.ceil(quantity / sheetsPerPrint);
    
    // 获取对裱单价
    const mountingInfo = MOUNTING_COMBINATIONS[mounting.combination];
    if (!mountingInfo) return 0;
    
    // 计算对裱面积（平方米）
    const mountingArea = (printingInfo.size.length * printingInfo.size.width * totalSheets) / 1000000;
    
    // 计算对裱费用
    return mountingArea * mountingInfo.price;
  };

  const calculateDieCuttingCost = () => {
    if (!dieCutting.required) return 0;
    
    // 计算印张数量（使用之前计算的方法）
    const printingInfo = PRINTING_PRICES[printingType];
    if (!printingInfo) return 0;
    
    const sheetsPerPrint = Math.floor((printingInfo.size.length * printingInfo.size.width) / (productLength * productWidth));
    const totalSheets = Math.ceil(quantity / sheetsPerPrint);
    
    // 计算模切费用
    let processCost;
    if (totalSheets <= 1000) {
      processCost = 80; // 1000印张以内固定80元
    } else {
      processCost = totalSheets * 0.06; // 1000印张以上按0.06元/张
    }
    
    // 加上模具费用
    const totalCost = processCost + (dieCutting.moldCost || 0);
    
    return totalCost;
  };

  const calculateLaminationCost = () => {
    if (!lamination.required) return 0;
    
    // 获取印刷尺寸信息
    const printingInfo = PRINTING_PRICES[printingType];
    if (!printingInfo) return 0;
    
    // 计算印张数量
    const sheetsPerPrint = Math.floor((printingInfo.size.length * printingInfo.size.width) / (productLength * productWidth));
    const totalSheets = Math.ceil(quantity / sheetsPerPrint);
    
    // 计算覆膜面积（平方米）
    const laminationArea = (printingInfo.size.length * printingInfo.size.width * totalSheets) / 1000000;
    
    // 获取覆膜单价
    const laminationInfo = LAMINATION_TYPES[lamination.type];
    if (!laminationInfo) return 0;
    
    return laminationArea * laminationInfo.price;
  };

  const calculateQuote = () => {
    const embossObjects = embossPositions.map(pos => 
      new EmbossPosition(pos.length, pos.width, pos.setupFee)
    );
  
    const printingInfo = PRINTING_PRICES[printingType];
    const printArea = printingInfo ? 
      (printingInfo.size.length * printingInfo.size.width) / 1000000 : 0;
  
    return calculateTotalCost({
      quantity,
      materialCost: calculateMaterialCost(),
      printingType,
      embossPositions: embossObjects,
      uvCost,
      mountingCost: calculateMountingCost(), // 修改这里，不再传入 printArea
      dieCuttingCost: calculateDieCuttingCost(),
      dieCuttingMoldCost: dieCutting.moldCost,
      laminationCost: calculateLaminationCost(),
      oilType: oilFinish.required ? oilFinish.type : null,
      oilCost: oilFinish.cost,
      bondingRequired: bonding
    });
  };
  return (
    <div className="quote-calculator">
      {/* 基础信息 */}
      <section className="basic-info">
        <h3>基础信息</h3>
        <div className="input-grid">
          <div className="input-group">
            <label>印刷数量</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min="1"
              style={inputStyle}
            />
          </div>
          <div className="input-group">
            <label>成品尺寸-长(mm)</label>
            <input
              type="number"
              value={productLength}
              onChange={(e) => setProductLength(Number(e.target.value))}
              min="1"
              style={inputStyle}
            />
          </div>
          <div className="input-group">
            <label>成品尺寸-宽(mm)</label>
            <input
              type="number"
              value={productWidth}
              onChange={(e) => setProductWidth(Number(e.target.value))}
              min="1"
              style={inputStyle}
            />
          </div>
        </div>
      </section>

      {/* 材料选择 */}
      <section className="material-selection">
        <h3>材料选择</h3>
        <div className="input-grid">
          <div className="input-group">
            <label>材料类型</label>
            <select
              value={materialType}
              onChange={(e) => setMaterialType(e.target.value)}
              style={inputStyle}
            >
              {Object.entries(MATERIAL_TYPES).map(([key, value]) => (
                <option key={key} value={key}>{value.name}</option>
              ))}
            </select>
          </div>
          {materialType !== 'corrugatedE' && materialType !== 'corrugatedF' && (
            <div className="input-group">
              <label>克重</label>
              <select
                value={materialWeight}
                onChange={(e) => setMaterialWeight(Number(e.target.value))}
                style={inputStyle}
              >
                {MATERIAL_TYPES[materialType].types.map(type => (
                  <option key={type.weight} value={type.weight}>
                    {type.weight}g
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </section>

      {/* 印刷选择 */}
      <section className="printing-selection">
        <h3>印刷工艺</h3>
        <div className="input-group">
          <label>印刷方式</label>
          <select
            value={printingType}
            onChange={(e) => setPrintingType(e.target.value)}
            style={inputStyle}
          >
            {Object.entries(PRINTING_PRICES).map(([key, value]) => (
              <option key={key} value={key}>{value.name}</option>
            ))}
          </select>
        </div>
      </section>

      {/* 烫金工艺 */}
      <section className="emboss-positions">
        <h3>烫金工艺</h3>
        <button 
          onClick={addEmbossPosition}
          style={{
            padding: '8px 16px',
            marginBottom: '16px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          添加烫金位置
        </button>
        {embossPositions.map((position, index) => (
          <div key={position.id} className="emboss-position" style={{ marginBottom: '20px' }}>
            <h4>烫金位置 {index + 1}</h4>
            <div className="input-grid">
              <div className="input-group">
                <label>长度(cm)</label>
                <input
                  type="number"
                  value={position.length}
                  onChange={(e) => updateEmbossPosition(position.id, 'length', e.target.value)}
                  min="0"
                  step="0.1"
                  style={inputStyle}
                />
              </div>
              <div className="input-group">
                <label>宽度(cm)</label>
                <input
                  type="number"
                  value={position.width}
                  onChange={(e) => updateEmbossPosition(position.id, 'width', e.target.value)}
                  min="0"
                  step="0.1"
                  style={inputStyle}
                />
              </div>
              <div className="input-group">
                <label>版费(元)</label>
                <input
                  type="number"
                  value={position.setupFee}
                  onChange={(e) => updateEmbossPosition(position.id, 'setupFee', e.target.value)}
                  min="0"
                  style={inputStyle}
                />
              </div>
              <button 
                onClick={() => removeEmbossPosition(position.id)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  alignSelf: 'flex-end'
                }}
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* UV工艺 */}
      <section className="uv-process">
        <h3>UV工艺</h3>
        <div className="input-group">
          <label>UV费用(元)</label>
          <input
            type="number"
            value={uvCost}
            onChange={(e) => setUvCost(Number(e.target.value))}
            min="0"
            style={inputStyle}
          />
        </div>
      </section>

     {/* 对裱工艺 */}
<section className="mounting-selection">
  <h3>对裱工艺</h3>
  <div className="input-group">
    <label style={{ display: 'flex', alignItems: 'center' }}>
      <input
        type="checkbox"
        checked={mounting.required}
        onChange={(e) => setMounting(prev => ({
          ...prev,
          required: e.target.checked
        }))}
        style={checkboxStyle}
      />
      需要对裱
    </label>
  </div>
  
{mounting.required && (
  <div className="input-grid">
    <div className="input-group">
      <label>对裱组合</label>
      <select
        value={mounting.combination}
        onChange={(e) => setMounting(prev => ({
          ...prev,
          combination: e.target.value
        }))}
        style={inputStyle}
      >
        {Object.entries(MOUNTING_COMBINATIONS).map(([key, value]) => (
          <option key={key} value={key}>{value.name}</option>
        ))}
      </select>
    </div>
    
    {!mounting.combination.includes('corrugated') && (
      <>
        <div className="input-group">
          <label>上层克重</label>
          <select
            value={mounting.topWeight}
            onChange={(e) => setMounting(prev => ({
              ...prev,
              topWeight: Number(e.target.value)
            }))}
            style={inputStyle}
          >
            {MATERIAL_TYPES['whiteCard']?.types?.map(type => (
              <option key={type.weight} value={type.weight}>
                {type.weight}g
              </option>
            ))}
          </select>
        </div>
        <div className="input-group">
          <label>下层克重</label>
          <select
            value={mounting.bottomWeight}
            onChange={(e) => setMounting(prev => ({
              ...prev,
              bottomWeight: Number(e.target.value)
            }))}
            style={inputStyle}
          >
            {/* 修改这里的逻辑 */}
            {(() => {
              const bottomMaterial = mounting.combination.split('To')[1].toLowerCase();
              const materialKey = bottomMaterial === 'grey' ? 'greyCard' : 
                                bottomMaterial === 'corrugatede' ? 'corrugatedE' :
                                bottomMaterial === 'corrugatedf' ? 'corrugatedF' : 'whiteCard';
              
              return MATERIAL_TYPES[materialKey]?.types?.map(type => (
                <option key={type.weight} value={type.weight}>
                  {type.weight}g
                </option>
              ));
            })()}
          </select>
        </div>
      </>
    )}
  </div>
)}
</section>

      {/* 模切信息 */}
      <section className="die-cutting">
        <h3>模切工艺</h3>
        <div className="input-group">
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={dieCutting.required}
              onChange={(e) => setDieCutting(prev => ({
                ...prev,
                required: e.target.checked
              }))}
              style={checkboxStyle}
            />
            需要模切
          </label>
        </div>
        
        {dieCutting.required && (
          <div className="input-group">
            <label>刀模费用(元)</label>
            <input
              type="number"
              value={dieCutting.moldCost}
              onChange={(e) => setDieCutting(prev => ({
                ...prev,
                moldCost: Number(e.target.value)
              }))}
              min="0"
              style={inputStyle}
            />
          </div>
        )}
      </section>

      {/* 覆膜选择 */}
      <section className="lamination">
        <h3>覆膜工艺</h3>
        <div className="input-group">
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={lamination.required}
              onChange={(e) => setLamination(prev => ({
                ...prev,
                required: e.target.checked
              }))}
              style={checkboxStyle}
            />
            需要覆膜
          </label>
        </div>
        
        {lamination.required && (
          <div className="input-group">
            <label>覆膜类型</label>
            <select
              value={lamination.type}
              onChange={(e) => setLamination(prev => ({
                ...prev,
                type: e.target.value
              }))}
              style={inputStyle}
            >
              {Object.entries(LAMINATION_TYPES).map(([key, value]) => (
                <option key={key} value={key}>{value.name}</option>
              ))}
            </select>
          </div>
        )}
      </section>

      {/* 过油选择 */}
      <section className="oil-finish">
        <h3>过油工艺</h3>
        <div className="input-group">
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={oilFinish.required}
              onChange={(e) => setOilFinish(prev => ({
                ...prev,
                required: e.target.checked
              }))}
              style={checkboxStyle}
            />
            需要过油
          </label>
        </div>
        
        {oilFinish.required && (
          <>
            <div className="input-group">
              <label>过油类型</label>
              <select
                value={oilFinish.type}
                onChange={(e) => setOilFinish(prev => ({
                  ...prev,
                  type: e.target.value
                }))}
                style={inputStyle}
              >
                <option value="matte">哑光油</option>
                <option value="glossy">亮光油</option>
              </select>
            </div>
            <div className="input-group">
              <label>过油费用(元)</label>
              <input
                type="number"
                value={oilFinish.cost}
                onChange={(e) => setOilFinish(prev => ({
                  ...prev,
                  cost: Number(e.target.value)
                }))}
                min="0"
                style={inputStyle}
              />
            </div>
          </>
        )}
      </section>

      {/* 粘和工艺 */}
      <section className="bonding">
        <h3>粘和工艺</h3>
        <div className="input-group">
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={bonding}
              onChange={(e) => setBonding(e.target.checked)}
              style={checkboxStyle}
            />
            需要粘和（0.1元/个）
          </label>
        </div>
      </section>

      {/* 计算结果 */}
      <section className="calculation-result">
        <h3>报价结果</h3>
        {(() => {
          const quote = calculateQuote();
          return (
            <div className="result-grid">
              <div className="result-item">
                <label>材料成本</label>
                <span>{quote.materialCost.toFixed(2)}元</span>
              </div>
              <div className="result-item">
                <label>印刷费用</label>
                <span>{quote.printingCost.toFixed(2)}元</span>
              </div>
              {mounting.required && (
                <div className="result-item">
                  <label>对裱费用</label>
                  <span>{quote.mountingCost.toFixed(2)}元</span>
                </div>
              )}
              {embossPositions.length > 0 && (
                <div className="result-item">
                  <label>烫金费用</label>
                  <span>{(quote.embossCost?.processCost || 0).toFixed(2)}元</span>
                </div>
              )}
              {dieCutting.required && (
                <div className="result-item">
                  <label>模切费用</label>
                  <span>{(quote.dieCuttingCost + quote.dieCuttingMoldCost).toFixed(2)}元</span>
                </div>
              )}
              <div className="result-item">
                <label>运费</label>
                <span>100.00元</span>
              </div>
              <div className="result-item">
              <label>利润率</label>
              <span>{((quote.profitRate - 1) * 100).toFixed(0)}%</span>
              </div>
              <div className="result-item">
                <label>利润率</label>
                <span>{((quote.profitRate - 1) * 100).toFixed(0)}%</span>
              </div>
              <div className="result-item total">
                <label>总计</label>
                <span>{quote.total.toFixed(2)}元</span>
              </div>
              <div className="result-item total">
          <label>单价</label>
          <span>{(quote.total / quantity).toFixed(2)}元/个</span>
        </div>
      </div>
    );
  })()}
</section>
           

      <style>{`
        .quote-calculator {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        section {
          margin-bottom: 30px;
          padding: 20px;
          border: 1px solid #e8e8e8;
          border-radius: 8px;
          background-color: white;
        }
        
        h3 {
          margin-bottom: 20px;
          color: #333;
          font-size: 18px;
          font-weight: bold;
        }
        
        .input-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
        }
        
        .input-group {
          margin-bottom: 15px;
        }
        
        .result-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
        }
        
        .result-item {
          padding: 15px;
          background: #f5f5f5;
          border-radius: 4px;
        }
        
        .result-item.total {
          grid-column: 1 / -1;
          background: #1976d2;
          color: white;
        }
        
        .result-item span {
          display: block;
          font-size: 20px;
          font-weight: bold;
          margin-top: 5px;
        }

        .emboss-position {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 15px;
        }
      `}</style>
    </div>
  );
}

export default QuoteCalculator;