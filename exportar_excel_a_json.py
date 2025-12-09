import pandas as pd

EXCEL_FILE = "02. INFORME CONSUMOS MENSUALES VISIONAMOS.xlsx"
SHEET_NAME = "Base operaciones"  # nombre de la hoja
OUTPUT_JSON = "base-operaciones.json"


def main():
    # 1. Leer la hoja correcta
    df = pd.read_excel(EXCEL_FILE, sheet_name=SHEET_NAME)

    print("Columnas encontradas en el Excel:")
    for col in df.columns:
        print(f"- {col}")

    # 2. Convertimos MES a formato YYYY-MM-DD (texto)
    df["MES"] = pd.to_datetime(df["MES"]).dt.strftime("%Y-%m-%d")

    # 3. Columnas que queremos exportar (deben coincidir EXACTO con el Excel)
    columnas_deseadas = [
        "MES",
        "AÑO",
        "ENTIDAD",
        "VALIDACIÓN DE IDENTIDAD",
        "ANÁLISIS DEUDOR",
        "ANÁLISIS CODEUDOR",
        "TOTAL",
    ]

    # Nos quedamos solo con las columnas que realmente existan,
    # para evitar que truene con un KeyError si hay una tilde mal, etc.
    columnas_existentes = [c for c in columnas_deseadas if c in df.columns]

    print("\nColumnas que se van a exportar:")
    for c in columnas_existentes:
        print(f"- {c}")

    df = df[columnas_existentes]

    # 4. Verificar totales numéricos
    print("\nTotales por columna (suma):")
    cols_numericas = [c for c in ["VALIDACIÓN DE IDENTIDAD", "ANÁLISIS DEUDOR", "ANÁLISIS CODEUDOR", "TOTAL"] if c in df.columns]
    print(df[cols_numericas].sum(numeric_only=True))

    # 5. Mostrar ejemplos con deudor/codeudor > 0 (solo para ver que sí hay info)
    if "ANÁLISIS DEUDOR" in df.columns:
        deudor_pos = df[df["ANÁLISIS DEUDOR"] > 0].head(10)
        print("\nEjemplo filas con ANÁLISIS DEUDOR > 0:")
        print(deudor_pos)

    if "ANÁLISIS CODEUDOR" in df.columns:
        codeudor_pos = df[df["ANÁLISIS CODEUDOR"] > 0].head(10)
        print("\nEjemplo filas con ANÁLISIS CODEUDOR > 0:")
        print(codeudor_pos)

    # 6. Exportar a JSON
    df.to_json(OUTPUT_JSON, orient="records", force_ascii=False)
    print(f"\n✅ JSON generado correctamente: {len(df)} registros → {OUTPUT_JSON}")


if __name__ == "__main__":
    main()
