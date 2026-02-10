"""
Analizar estructura de archivos CSV de TINSA
"""
import pandas as pd
from pathlib import Path

data_dir = Path("data")

files = ["tinsa_rm.csv", "tinsa_norte_sur.csv"]

for filename in files:
    filepath = data_dir / filename
    if not filepath.exists():
        print(f"❌ No encontrado: {filename}")
        continue
    
    print(f"\n{'='*80}")
    print(f"📄 Archivo: {filename}")
    print(f"{'='*80}")
    
    # Try different delimiters
    for sep in [';', ',', '\t', '|']:
        try:
            df = pd.read_csv(filepath, sep=sep, nrows=3, encoding='utf-8')
            if len(df.columns) > 10:  # Likely correct delimiter
                print(f"\n✅ Delimitador encontrado: '{sep}'")
                print(f"📊 Columnas: {len(df.columns)}")
                print(f"\n📋 Nombres de columnas:")
                for i, col in enumerate(df.columns, 1):
                    print(f"  {i:2d}. {col}")
                
                print(f"\n📊 Primera fila de datos:")
                if len(df) > 0:
                    first_row = df.iloc[0]
                    for col in df.columns[:20]:  # First 20 columns
                        val = first_row[col]
                        print(f"  {col}: {val}")
                
                # Get total count
                df_full = pd.read_csv(filepath, sep=sep)
                print(f"\n✅ Total de filas: {len(df_full):,}")
                break
        except Exception as e:
            continue
    else:
        print(f"❌ No se pudo determinar el delimitador")
