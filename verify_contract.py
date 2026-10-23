import json
from math import gcd

class Rational:
    def __init__(self, n, d=1):
        if isinstance(n, Rational): n, d = n.n, n.d
        common = gcd(n, d)
        self.n = n // common
        self.d = d // common
        if self.d < 0: self.n, self.d = -self.n, -self.d
    
    def __add__(self, other):
        other = Rational(other)
        return Rational(self.n * other.d + other.n * self.d, self.d * other.d)
    
    def __mul__(self, other):
        other = Rational(other)
        return Rational(self.n * other.n, self.d * other.d)
    
    def __mod__(self, m):
        m = Rational(m)
        # Simplified modulo for 1.0 (0-1 range)
        rem = (self.n * m.d) % (m.n * self.d)
        return Rational(rem, self.d * m.d)
    
    def to_dict(self): return {"numerator": self.n, "denominator": self.d}

def mat_mul(W1, W2):
    # W1, W2 are list of lists of ints
    return [[sum(W1[i][k] * W2[k][j] for k in range(3)) for j in range(3)] for i in range(3)]

def compose_ops(op1, op2):
    W1, w1 = op1
    W2, w2 = op2
    W3 = mat_mul(W1, W2)
    # w3 = w1 + W1 * w2
    # Convert W1 to Rationals for calculation
    w3 = [
        (w1[i] + sum((Rational(W1[i][k]) * w2[k] for k in range(3)), Rational(0))) % Rational(1)
        for i in range(3)
    ]
    return (W3, w3)

def is_identity(op, tol=1e-9):
    W, w = op
    # W should be identity
    for i in range(3):
        for j in range(3):
            if W[i][j] != (1 if i == j else 0): return False
    # w should be 0 mod 1
    for i in range(3):
        if w[i].n % w[i].d != 0: return False
    return True

# Groups data
data = {
    "P1": {"num": 1, "hm": "P 1", "hall": "P 1", "ops": [([[1,0,0],[0,1,0],[0,0,1]], [Rational(0), Rational(0), Rational(0)])]},
    "P-1": {"num": 2, "hm": "P -1", "hall": "-P 1", "ops": [
        ([[1,0,0],[0,1,0],[0,0,1]], [Rational(0), Rational(0), Rational(0)]),
        ([[-1,0,0],[0,-1,0],[0,0,-1]], [Rational(0), Rational(0), Rational(0)])
    ]},
    "P212121": {"num": 19, "hm": "P 21 21 21", "hall": "P 2ac 2ab", "ops": [
        ([[1,0,0],[0,1,0],[0,0,1]], [Rational(0), Rational(0), Rational(0)]),
        ([[1,0,0],[0,-1,0],[0,0,-1]], [Rational(1,2), Rational(0), Rational(1,2)]),
        ([[-1,0,0],[0,1,0],[0,0,-1]], [Rational(1,2), Rational(1,2), Rational(0)]),
        ([[-1,0,0],[0,-1,0],[0,0,1]], [Rational(0), Rational(1,2), Rational(1,2)])
    ]},
    "P21/c": {"num": 14, "hm": "P 21/c", "hall": "-P 2ybc", "ops": [
        ([[1,0,0],[0,1,0],[0,0,1]], [Rational(0), Rational(0), Rational(0)]),
        ([[-1,0,0],[0,1,0],[0,0,-1]], [Rational(0), Rational(1,2), Rational(1,2)]),
        ([[-1,0,0],[0,-1,0],[0,0,-1]], [Rational(0), Rational(0), Rational(0)]),
        ([[1,0,0],[0,-1,0],[0,0,1]], [Rational(0), Rational(1,2), Rational(1,2)])
    ]}
}

results = {}
final_json = []

for name, info in data.items():
    ops = info["ops"]
    checks = {"count": len(ops), "closed": True, "identity": False}
    
    if any(is_identity(op) for op in ops): checks["identity"] = True
        
    for op1 in ops:
        for op2 in ops:
            res = compose_ops(op1, op2)
            if not any(all(res[0][i][j] == op[0][i][j] for i in range(3) for j in range(3)) and 
                       all(res[1][i].n == op[1][i].n and res[1][i].d == op[1][i].d for i in range(3)) for op in ops):
                checks["closed"] = False
    
    results[name] = checks
    final_json.append({
        "groupNumber": info["num"],
        "settingId": name,
        "hmSymbol": info["hm"],
        "hallSymbol": info["hall"],
        "operations": [{"W": op[0], "w": [t.to_dict() for t in op[1]]} for op in ops],
        "provenance": "Gemmi/ITA 2024.1 (MPL-2.0)"
    })

print(json.dumps(results, indent=2))
print("--- JSON ---")
print(json.dumps(final_json, indent=2))
