import json

# Minimal implementation based on Gemmi/ITA knowledge for validation
def compose(op1, op2):
    # (W1, w1) * (W2, w2) = (W1*W2, W1*w2 + w1)
    W1, w1 = op1
    W2, w2 = op2
    # Matrix mult W1*W2
    W3 = [[sum(W1[i][k] * W2[k][j] for k in range(3)) for j in range(3)] for i in range(3)]
    # Vector w1 + W1*w2
    w3 = [(w1[i] + sum(W1[i][k] * w2[k] for k in range(3))) % 1.0 for i in range(3)]
    return (W3, w3)

def is_identity(op, tol=1e-9):
    W, w = op
    # W should be identity
    for i in range(3):
        for j in range(3):
            if abs(W[i][j] - (1 if i == j else 0)) > tol: return False
    # w should be 0 mod 1
    for i in range(3):
        if abs(w[i] % 1.0) > tol: return False
    return True

# Groups data (standard Gemmi/ITA definitions)
groups = {
    "P1": {
        "num": 1, "ops": [([[1,0,0],[0,1,0],[0,0,1]], [0,0,0])]
    },
    "P-1": {
        "num": 2, "ops": [([[1,0,0],[0,1,0],[0,0,1]], [0,0,0]), ([[-1,0,0],[0,-1,0],[0,0,-1]], [0,0,0])]
    },
    "P212121": {
        "num": 19, "ops": [
            ([[1,0,0],[0,1,0],[0,0,1]], [0,0,0]),
            ([[1,0,0],[0,-1,0],[0,0,-1]], [0.5,0,0.5]),
            ([[-1,0,0],[0,1,0],[0,0,-1]], [0.5,0.5,0]),
            ([[-1,0,0],[0,-1,0],[0,0,1]], [0,0.5,0.5])
        ]
    },
    "P21/c": {
        "num": 14, "ops": [
            ([[1,0,0],[0,1,0],[0,0,1]], [0,0,0]),
            ([[-1,0,0],[0,1,0],[0,0,-1]], [0,0.5,0.5]),
            ([[-1,0,0],[0,-1,0],[0,0,-1]], [0,0,0]),
            ([[1,0,0],[0,-1,0],[0,0,1]], [0,0.5,0.5])
        ]
    }
}

results = {}
for name, data in groups.items():
    ops = data["ops"]
    checks = {
        "count": len(ops),
        "has_identity": any(is_identity(op) for op in ops),
        "closed": True
    }
    # Check closure
    for op1 in ops:
        for op2 in ops:
            res = compose(op1, op2)
            if not any(all(abs(res[0][i][j] - op[0][i][j]) < 1e-9 for i in range(3) for j in range(3)) and 
                       all(abs(res[1][i] - op[1][i]) < 1e-9 for i in range(3)) for op in ops):
                checks["closed"] = False
    results[name] = checks

print(json.dumps(results, indent=2))
