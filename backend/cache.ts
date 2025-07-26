import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 }); // 60s default TTL

export default cache; 