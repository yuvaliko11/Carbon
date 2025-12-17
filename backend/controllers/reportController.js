const CarbonContract = require('../models/CarbonContract');

exports.getGeoJSON = async (req, res) => {
    try {
        const { type } = req.query;

        if (type === 'carbon-contracts') {
            const contracts = await CarbonContract.find();

            const features = contracts.map(contract => {
                // Ensure we have a valid geometry
                let geometry = contract.location;

                // If location is missing or invalid, default to a point in Fiji
                if (!geometry || !geometry.coordinates || geometry.coordinates.length === 0) {
                    geometry = {
                        type: 'Point',
                        coordinates: [178.0, -17.8]
                    };
                }

                return {
                    type: 'Feature',
                    geometry: geometry,
                    properties: {
                        type: 'carbon-contract',
                        id: contract._id,
                        name: contract.name,
                        status: contract.status,
                        mataqaliName: contract.mataqaliName,
                        greenScore: contract.greenScore,
                        annualRent: contract.annualRent,
                        termYears: contract.termYears,
                        fileUrl: contract.fileUrl
                    }
                };
            });

            return res.json({
                type: 'FeatureCollection',
                features: features
            });
        }

        // Return empty FeatureCollection for other types for now
        res.json({
            type: 'FeatureCollection',
            features: []
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getSitesSummary = async (req, res) => {
    res.json({ total: 0, active: 0 });
};

exports.getPropertiesSummary = async (req, res) => {
    res.json({ total: 0, active: 0 });
};
