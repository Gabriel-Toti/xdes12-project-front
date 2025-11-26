// Utilidades de compatibilidade espelhando a lógica do backend
// Backend: casar-back/src/utils/attributes.ts e compatibility.service.ts

const ATTRIBUTE_CONFIG = {
  "Uso de álcool": {
    type: "closed" as const,
    expected: [] as string[],
  },
  "Frequência de festas": {
    type: "closed" as const,
    expected: [] as string[],
  },
  "Presença de Pets": {
    type: "closed" as const,
    expected: [] as string[],
  },
  "Estilo de Convivência": {
    type: "closed" as const,
    expected: [] as string[],
  },
  "Hobbies": {
    type: "closed" as const,
    expected: [] as string[],
  },
  "Tipo de Moradia": {
    type: "closed" as const,
    expected: [] as string[],
  },
  "Gênero do colega de quarto": {
    type: "closed" as const,
    expected: [] as string[],
  },
  "Localização": {
    type: "location" as const,
    expected: ["distance_in_km"],
  },
  "Horários de silêncio": {
    type: "schedule" as const,
    expected: ["HHh-HHh; HHh-HHh; ..."],
  },
} as const;

export type AllowedAttributeName = keyof typeof ATTRIBUTE_CONFIG;

type AttributeType = (typeof ATTRIBUTE_CONFIG)[AllowedAttributeName]["type"];

export function isValidAttributeName(attributeName: string): attributeName is AllowedAttributeName {
  return attributeName in ATTRIBUTE_CONFIG;
}

/**
 * Calcula a compatibilidade entre uma preferência e uma regra (0 a 1),
 * espelhando calculateAttributeCompatibility do backend.
 */
export function calculateAttributeCompatibility(
  preferenceName: string,
  preferenceValue: string,
  ruleName: string,
  ruleValue: string
): number {
  if (preferenceName !== ruleName) {
    return 0;
  }

  if (!isValidAttributeName(preferenceName)) {
    return 0;
  }

  const config = ATTRIBUTE_CONFIG[preferenceName];

  // Tipo "closed" (enum / múltipla escolha)
  if (config.type === "closed") {
    const prefValues = preferenceValue.split(",").map((v) => v.trim()).filter(Boolean);
    const ruleValues = ruleValue.split(",").map((v) => v.trim()).filter(Boolean);

    if (prefValues.length === 0 || ruleValues.length === 0) {
      return 0;
    }

    const matches = prefValues.filter((pv) => ruleValues.includes(pv)).length;
    if (matches === 0) {
      return 0;
    }

    const baseScore = matches / Math.max(prefValues.length, ruleValues.length);
    return baseScore;
  }

  // Tipo "location" (distância em km)
  if (config.type === "location") {
    const prefDistance = parseFloat(preferenceValue);
    const ruleDistance = parseFloat(ruleValue);

    if (isNaN(prefDistance) || isNaN(ruleDistance)) {
      return 0;
    }

    // Nova regra (espelhando o backend):
    // - Se a regra é mais restrita (menor raio) que a preferência => 100% compatível
    // - Se a regra é mais permissiva (maior raio) que a preferência => compatibilidade
    //   decai em função da distância (ruleDistance - prefDistance)
    if (ruleDistance < prefDistance) {
      return 1;
    }

    const diff = ruleDistance - prefDistance;
    const span = Math.max(1, prefDistance * 5);
    const baseScore = Math.max(0, 1 - diff / span);
    return baseScore;
  }

  // Tipo "schedule" (intervalos de horário)
  if (config.type === "schedule") {
    const parseSchedule = (
      scheduleStr: string
    ): Array<{ start: number; end: number }> => {
      if (!scheduleStr || scheduleStr.trim() === "") {
        return [];
      }
      return scheduleStr
        .split(";")
        .map((interval) => {
          const trimmed = interval.trim();
          if (!trimmed) return { start: -1, end: -1 };
          const parts = trimmed.split("-");
          if (parts.length !== 2 || !parts[0] || !parts[1]) {
            return { start: -1, end: -1 };
          }
          const start = parseInt(parts[0].trim().replace("h", ""));
          const end = parseInt(parts[1].trim().replace("h", ""));
          return {
            start: isNaN(start) ? -1 : start,
            end: isNaN(end) ? -1 : end,
          };
        })
        .filter(
          (i) =>
            i.start >= 0 &&
            i.end >= 0 &&
            i.start <= 23 &&
            i.end <= 23
        );
    };

    const prefIntervals = parseSchedule(preferenceValue);
    const ruleIntervals = parseSchedule(ruleValue);

    if (prefIntervals.length === 0 || ruleIntervals.length === 0) {
      return 0;
    }

    let matchingIntervals = 0;
    for (const prefInterval of prefIntervals) {
      for (const ruleInterval of ruleIntervals) {
        if (
          (prefInterval.start >= ruleInterval.start &&
            prefInterval.end <= ruleInterval.end) ||
          (prefInterval.start <= ruleInterval.end &&
            prefInterval.end >= ruleInterval.start)
        ) {
          matchingIntervals++;
          break;
        }
      }
    }

    if (matchingIntervals === 0) {
      return 0;
    }

    const baseScore = matchingIntervals / prefIntervals.length;
    return baseScore;
  }

  return 0;
}

export type PreferenceWithWeight = {
  name: string;
  value: string;
  weight: number;
};

export type RuleAttribute = {
  name: string;
  value: string;
};

export type CompatibilityDetail = {
  name: string;
  userValue: string | null;
  propertyValue: string | null;
  weight: number | null;
  baseScore: number | null; // 0-1 para critérios avaliados
  weightedScore: number | null; // baseScore * weight para critérios avaliados
  hasPropertyRule: boolean;
  hasUserPreference: boolean;
};

/**
 * Calcula compatibilidade ponderada e devolve detalhes por critério,
 * espelhando calculateUserPropertyCompatibility, mas com breakdown.
 */
export function calculateWeightedCompatibilityDetails(
  userPreferences: PreferenceWithWeight[],
  propertyRules: RuleAttribute[]
): {
  totalScore: number; // 0-1
  totalWeight: number;
  details: CompatibilityDetail[];
} {
  const rulesMap = new Map<string, string>();
  propertyRules.forEach((r) => {
    if (isValidAttributeName(r.name)) {
      rulesMap.set(r.name, r.value);
    }
  });

  const details: CompatibilityDetail[] = [];
  let weightedScore = 0;
  let totalWeight = 0;

  // Preferências do usuário (podem ter ou não regra correspondente)
  userPreferences.forEach((pref) => {
    if (!isValidAttributeName(pref.name)) {
      return;
    }

    const ruleValue = rulesMap.get(pref.name) ?? null;

    if (ruleValue !== null) {
      const base = calculateAttributeCompatibility(
        pref.name,
        pref.value,
        pref.name,
        ruleValue
      );
      const wScore = base * pref.weight;

      weightedScore += wScore;
      totalWeight += pref.weight;

      details.push({
        name: pref.name,
        userValue: pref.value,
        propertyValue: ruleValue,
        weight: pref.weight,
        baseScore: base,
        weightedScore: wScore,
        hasPropertyRule: true,
        hasUserPreference: true,
      });
    } else {
      // Preferência sem regra correspondente:
      // impacto MUITO leve no cálculo (pequena penalização no denominador),
      // mas sem alterar o numerador (mantém weightedScore em 0).
      const penaltyFactor = 0.1; // 10% do peso original
      totalWeight += pref.weight * penaltyFactor;

      details.push({
        name: pref.name,
        userValue: pref.value,
        propertyValue: null,
        weight: pref.weight,
        baseScore: null,
        weightedScore: null,
        hasPropertyRule: false,
        hasUserPreference: true,
      });
    }
  });

  // Regras que não têm preferência correspondente (alerta, não entram no cálculo)
  propertyRules.forEach((r) => {
    if (!isValidAttributeName(r.name)) {
      return;
    }
    const hasPref = userPreferences.some((p) => p.name === r.name);
    if (!hasPref) {
      details.push({
        name: r.name,
        userValue: null,
        propertyValue: r.value,
        weight: null,
        baseScore: null,
        weightedScore: null,
        hasPropertyRule: true,
        hasUserPreference: false,
      });
    }
  });

  const totalScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

  // Ordenar detalhes por peso (maior primeiro), depois por baseScore
  details.sort((a, b) => {
    const wA = a.weight ?? 0;
    const wB = b.weight ?? 0;
    if (wA !== wB) return wB - wA;

    const sA = a.baseScore ?? -1;
    const sB = b.baseScore ?? -1;
    return sB - sA;
  });

  return { totalScore, totalWeight, details };
}


