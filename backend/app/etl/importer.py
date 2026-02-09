import pandas as pd
from app.db import get_supabase_client
import json

class TinsaImporter:
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.supabase = get_supabase_client()

    def load_data(self):
        """
        Loads data from Excel/CSV and returns a DataFrame.
        """
        print(f"Loading data from {self.file_path}...")
        if self.file_path.endswith('.xlsx'):
            df = pd.read_excel(self.file_path)
        elif self.file_path.endswith('.csv'):
            df = pd.read_csv(self.file_path)
        else:
            raise ValueError("Unsupported file format")
        
        # Basic cleaning
        df.columns = [c.lower().replace(' ', '_') for c in df.columns]
        return df

    def transform_project(self, row):
        """
        Maps a row from the source file to the 'projects' table schema.
        """
        # TODO: Map actual TINSA columns to our DB schema
        return {
            "name": row.get("nombre_proyecto", "Sin Nombre"),
            "commune": row.get("comuna", "Desconocida"),
            "region": row.get("region", "RM"),
            # Placeholder for geospatial logic
            # "location": ... 
        }

    def run(self):
        """
        Main execution method.
        """
        df = self.load_data()
        print(f"Loaded {len(df)} rows.")

        projects_to_insert = []
        
        for _, row in df.iterrows():
            project_data = self.transform_project(row)
            projects_to_insert.append(project_data)

        # Bulk insert (Upsert)
        if projects_to_insert:
            response = self.supabase.table("projects").upsert(
                projects_to_insert, on_conflict="name,commune"
            ).execute()
            print(f"Inserted/Updated projects. Response: {response}")

if __name__ == "__main__":
    # Example usage
    importer = TinsaImporter("data/sample_tinsa.xlsx")
    importer.run()
