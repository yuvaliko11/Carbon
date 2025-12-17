exports.getAll = async (req, res) => {
    res.json([]);
};

exports.getById = async (req, res) => {
    res.status(404).json({ message: 'Not found' });
};

exports.create = async (req, res) => {
    res.status(201).json({ message: 'Created (mock)' });
};

exports.update = async (req, res) => {
    res.json({ message: 'Updated (mock)' });
};

exports.delete = async (req, res) => {
    res.json({ message: 'Deleted (mock)' });
};
