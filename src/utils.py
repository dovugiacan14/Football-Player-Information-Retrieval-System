import json
from datetime import datetime

def load_json(json_path):
    with open(json_path, "r", encoding='utf-8') as file:
        data = json.load(file)
    return data

def save_json(data, file_path):
    with open(file_path, 'w', encoding='utf-8') as file:
        json.dump(data, file, indent=2, ensure_ascii=False, default=str)

def parse_date(date_str):
    try:
        return datetime.strptime(date_str, '%Y-%m-%d').date()
    except Exception:
        return None

def calculate_age(birth_date):
    if birth_date:
        today = datetime.now().date()
        return today.year - birth_date.year - (
            (today.month, today.day) < (birth_date.month, birth_date.day)
        )
    return None
