/**
 * Business document IDs: QT-XXXXX, INV-XXXXX, TXN-XXXXX, STL-XXXXX
 */
const generateBusinessId = (prefix = 'DOC') => {
  const n = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${n}`;
};

module.exports = generateBusinessId;
