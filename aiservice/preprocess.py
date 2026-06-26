import pandas as pd 

df = pd.read_csv("ai-service/data/raw_loans.csv") 


df = df[[                                
    "annual_inc",
    "loan_amnt",
    "int_rate",
    "emp_length",
    "loan_status",
    "earliest_cr_line"
]] 


df.dropna(inplace=True) 
print(f"Rows after initial dropna: {len(df)}") 

df = df[df["loan_status"].isin(["Fully Paid", "Charged Off"])] 
df["loan_status"] = df["loan_status"].map({  
    "Fully Paid": 0,
    "Charged Off": 1
})

def clean_emp_length(x): 
    x = str(x).strip().lower()
    if x in ("n/a", "nan", ""):
        return None  
    if "<" in x:
        return 0 
    if "10+" in x:
        return 10
    return int(x.split()[0]) 

df["emp_length"] = df["emp_length"].apply(clean_emp_length) 

df["int_rate"] = df["int_rate"].astype(str).str.replace("%", "", regex=False) 
df["int_rate"] = pd.to_numeric(df["int_rate"], errors="coerce") 


df["earliest_cr_line"] = pd.to_datetime(df["earliest_cr_line"]) 
df["credit_history"] = (pd.Timestamp.now() - df["earliest_cr_line"]).dt.days / 365           

final_df = df[[ 
    "annual_inc", 
    "loan_amnt", 
    "int_rate", 
    "emp_length", 
    "credit_history", 
    "loan_status"
]]

final_df = final_df.dropna()
print(f"Final rows after all cleaning: {len(final_df)}")

final_df.to_csv("cleaned_loans.csv", index=False) 
