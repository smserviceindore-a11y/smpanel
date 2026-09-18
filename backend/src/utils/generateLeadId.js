const Requirement = require('../models/Requirement');
const CustomizationRequest = require('../models/CustomizationRequest');

const generateLeadId = async () => {
  const lastRequirement = await Requirement.findOne().sort({ createdAt: -1 }).select('leadId');
  const lastCustomization = await CustomizationRequest.findOne().sort({ createdAt: -1 }).select('leadId');

  let lastNumber = 10000;

  const extractNumber = (leadId) => {
    if (!leadId) return 0;
    const num = parseInt(leadId.replace('SGH-', ''), 10);
    return isNaN(num) ? 0 : num;
  };

  const reqNum = extractNumber(lastRequirement?.leadId);
  const custNum = extractNumber(lastCustomization?.leadId);
  lastNumber = Math.max(lastNumber, reqNum, custNum);

  return `SGH-${lastNumber + 1}`;
};

module.exports = generateLeadId;
