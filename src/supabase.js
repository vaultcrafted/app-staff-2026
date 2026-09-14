import { createClient } from "@supabase/supabase-js";
export const SUPA_URL = "https://kiqghrxygraijcozdmkp.supabase.co";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpcWdocnh5Z3JhaWpjb3pkbWtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MzM2NjAsImV4cCI6MjA5NTQwOTY2MH0.ogxAPmqfVhezZ1mjddrAKWQcH6i6F5XPqU7ZIXX84GA";
export const supabase = createClient(SUPA_URL, ANON);
