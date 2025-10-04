CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('sent', 'received')),
    amount DECIMAL(18, 8) NOT NULL,
    address VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallets (
    id SERIAL PRIMARY KEY,
    address VARCHAR(100) UNIQUE NOT NULL,
    balance DECIMAL(18, 8) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO wallets (address, balance) VALUES ('UQMain...wallet', 2453.67) ON CONFLICT DO NOTHING;

INSERT INTO transactions (transaction_type, amount, address, status, created_at) 
VALUES 
    ('received', 125.5, 'UQA...3x2k', 'completed', NOW() - INTERVAL '1 day'),
    ('sent', 50.0, 'UQB...7y9m', 'completed', NOW() - INTERVAL '2 days'),
    ('received', 300.0, 'UQC...1a4n', 'pending', NOW() - INTERVAL '3 days'),
    ('sent', 75.25, 'UQD...8k2p', 'completed', NOW() - INTERVAL '4 days')
ON CONFLICT DO NOTHING;