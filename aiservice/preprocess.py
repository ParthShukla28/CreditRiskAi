import pandas as pd # pandas is a powerful library for data manipulation and analysis. It provides data structures like DataFrames that make it easy to work with structured data.

df = pd.read_csv("ai-service/data/raw_loans.csv") # Loading raw dataset


df = df[[                                        # step1
    "annual_inc",
    "loan_amnt",
    "int_rate",
    "emp_length",
    "loan_status",
    "earliest_cr_line"
]] # Keeping only required columns


df.dropna(inplace=True) # Dropping missing values (NaN) !! inplace=True ; it modifies the original df directly (no new DataFrame is created). # step2
print(f"Rows after initial dropna: {len(df)}")  # quick visibility into how much data this step removes

df = df[df["loan_status"].isin(["Fully Paid", "Charged Off"])] # Keeps only rows where: Loan is Fully Paid; Loan is Charged Off; Removes other categories. # step3
df["loan_status"] = df["loan_status"].map({  # Converting loan_status to binary  
    "Fully Paid": 0,
    "Charged Off": 1
})

def clean_emp_length(x): # Cleaning employment length
    x = str(x).strip().lower()
    if x in ("n/a", "nan", ""):
        return None  # unknown employment length -> NaN, handled by dropna below instead of crashing
    if "<" in x:
        return 0 # If employment length is less than 1 year, return 0
    if "10+" in x:
        return 10
    return int(x.split()[0]) # otherwise split string ; Take the first number of string & Convert it to integer and then return that number.

df["emp_length"] = df["emp_length"].apply(clean_emp_length) # Applies your cleaning function to every row. #step4

df["int_rate"] = df["int_rate"].astype(str).str.replace("%", "", regex=False) # Convert to string ! Remove % symbol !  step5
df["int_rate"] = pd.to_numeric(df["int_rate"], errors="coerce") # Converts string → float !! If conversion fails  makes it NaN !! 


df["earliest_cr_line"] = pd.to_datetime(df["earliest_cr_line"]) # Convert to datetime !! This allows us to do date calculations. # step6
df["credit_history"] = (pd.Timestamp.now() - df["earliest_cr_line"]).dt.days / 365           # step7 
# Takes today's date.
# Subtracts earliest credit date.
# Gets difference in days.
# Converts days → years.

# Final dataset 
final_df = df[[ 
    "annual_inc", 
    "loan_amnt", 
    "int_rate", 
    "emp_length", 
    "credit_history", 
    "loan_status"
]]

# Drop any NaNs introduced AFTER the first dropna — e.g. from int_rate coercion
# or emp_length "n/a" handling above. Without this, NaNs from those steps
# would silently leak into cleaned_loans.csv.
final_df = final_df.dropna()
print(f"Final rows after all cleaning: {len(final_df)}")

# Save cleaned data
final_df.to_csv("cleaned_loans.csv", index=False) 
# index=False → removes row numbers from file