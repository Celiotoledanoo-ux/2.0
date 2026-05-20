const { randomUUID } = require('crypto'); 


const generateUniqueId = () => {
  return randomUUID();
};

module.exports = {
  generateUniqueId
};
