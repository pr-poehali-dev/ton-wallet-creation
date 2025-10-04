import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: API для работы с транзакциями TON кошелька
    Args: event - dict с httpMethod, body, queryStringParameters
          context - object с request_id
    Returns: HTTP response с транзакциями или результатом операции
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    db_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(db_url)
    
    if method == 'GET':
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute('''
                SELECT id, transaction_type, amount, address, status, 
                       created_at::text as created_at
                FROM transactions 
                ORDER BY created_at DESC 
                LIMIT 20
            ''')
            transactions = cur.fetchall()
            
            cur.execute('SELECT balance FROM wallets LIMIT 1')
            wallet = cur.fetchone()
            balance = float(wallet['balance']) if wallet else 0
        
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'transactions': transactions,
                'balance': balance
            }, default=str),
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        tx_type = body_data.get('type')
        amount = float(body_data.get('amount', 0))
        address = body_data.get('address', '')
        
        with conn.cursor() as cur:
            cur.execute('''
                INSERT INTO transactions (transaction_type, amount, address, status)
                VALUES (%s, %s, %s, 'pending')
                RETURNING id
            ''', (tx_type, amount, address))
            
            tx_id = cur.fetchone()[0]
            
            if tx_type == 'sent':
                cur.execute('''
                    UPDATE wallets 
                    SET balance = balance - %s 
                    WHERE id = 1
                ''', (amount,))
            
            conn.commit()
        
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'id': tx_id, 'status': 'pending'}),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 405,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }
