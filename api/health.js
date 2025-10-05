module.exports = async (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    method: req.method
  });
};
