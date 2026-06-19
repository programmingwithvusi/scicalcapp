import yaml,traceback,sys
f = r"C:/Projects/Dev/imr4724/SciCalcApp/.github/workflows/ci.yml"
try:
    yaml.safe_load(open(f))
    print("YAML_OK")
except Exception as e:
    print("YAML_ERROR", e)
    traceback.print_exc()
    sys.exit(1)
