from supabase import create_client
import os
from dotenv import load_dotenv
load_dotenv()

def get_client():
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_KEY"]
    )