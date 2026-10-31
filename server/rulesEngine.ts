import {
  CitizenProfile,
  EligibilityMatchStatus,
  EligibilityRule,
  RuleEvaluationResult,
  Scheme,
  SchemeEvaluationResult,
} from './types';

/**
 * Deterministic Server-Side Eligibility Engine
 * Never hallucinates or bypasses legal statutory constraints.
 */
export class RulesEngine {
  /**
   * Evaluates a single rule against a citizen's profile
   */
  public static evaluateRule(rule: EligibilityRule, profile: CitizenProfile): RuleEvaluationResult {
    const rawValue = (profile as unknown as Record<string, unknown>)[rule.field];

    // Check if value is absent/unspecified in profile
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      return {
        ruleId: rule.id,
        field: rule.field,
        description: rule.description,
        status: 'missing_data',
        expected: this.formatExpectedValue(rule),
        actual: 'Not specified in citizen profile',
        mandatory: rule.mandatory,
      };
    }

    let passed = false;

    switch (rule.operator) {
      case 'equals':
        if (typeof rawValue === 'string' && typeof rule.value === 'string') {
          passed = rawValue.trim().toLowerCase() === rule.value.trim().toLowerCase();
        } else {
          passed = rawValue === rule.value;
        }
        break;

      case 'not_equals':
        if (typeof rawValue === 'string' && typeof rule.value === 'string') {
          passed = rawValue.trim().toLowerCase() !== rule.value.trim().toLowerCase();
        } else {
          passed = rawValue !== rule.value;
        }
        break;

      case 'less_than_or_equal':
        passed = Number(rawValue) <= Number(rule.value);
        break;

      case 'greater_than_or_equal':
        passed = Number(rawValue) >= Number(rule.value);
        break;

      case 'in':
        if (Array.isArray(rule.value)) {
          const needle = String(rawValue).toLowerCase().trim();
          passed = rule.value.some((v) => String(v).toLowerCase().trim() === needle || String(v).toLowerCase().trim() === 'all');
        } else {
          passed = String(rule.value).toLowerCase().includes(String(rawValue).toLowerCase());
        }
        break;

      case 'not_in':
        if (Array.isArray(rule.value)) {
          const needle = String(rawValue).toLowerCase().trim();
          passed = !rule.value.some((v) => String(v).toLowerCase().trim() === needle);
        } else {
          passed = !String(rule.value).toLowerCase().includes(String(rawValue).toLowerCase());
        }
        break;

      case 'is_true':
        passed = Boolean(rawValue) === true;
        break;

      case 'is_false':
        passed = Boolean(rawValue) === false;
        break;

      default:
        passed = false;
    }

    return {
      ruleId: rule.id,
      field: rule.field,
      description: rule.description,
      status: passed ? 'passed' : 'failed',
      expected: this.formatExpectedValue(rule),
      actual: this.formatActualValue(rawValue),
      mandatory: rule.mandatory,
    };
  }

  /**
   * Deterministically evaluates an entire scheme against a citizen profile
   */
  public static evaluateScheme(scheme: Scheme, profile: CitizenProfile): SchemeEvaluationResult {
    // Also check state residency level rule if scheme is state-specific
    const schemeRules = [...scheme.rules];
    
    // Add default state boundary rule if state is not All India and not already in rules
    if (scheme.level === 'State' && scheme.state && scheme.state !== 'All India') {
      const hasStateRule = schemeRules.some((r) => r.field === 'state');
      if (!hasStateRule) {
        schemeRules.unshift({
          id: 'auto_state_residence',
          field: 'state',
          operator: 'equals',
          value: scheme.state,
          description: `Must be a bona fide resident or domiciled in ${scheme.state}`,
          mandatory: true,
        });
      }
    }

    const passedRules: RuleEvaluationResult[] = [];
    const failedRules: RuleEvaluationResult[] = [];
    const missingRules: RuleEvaluationResult[] = [];

    for (const rule of schemeRules) {
      const result = this.evaluateRule(rule, profile);
      if (result.status === 'passed') {
        passedRules.push(result);
      } else if (result.status === 'failed') {
        failedRules.push(result);
      } else {
        missingRules.push(result);
      }
    }

    // Determine deterministic outcome status:
    // 1. If any mandatory rule failed -> strictly Ineligible
    // 2. Else if any mandatory rule is missing information -> Insufficient Information
    // 3. Else all rules evaluated and passed -> Eligible
    let status: EligibilityMatchStatus;
    const reasons: string[] = [];

    const mandatoryFailures = failedRules.filter((r) => r.mandatory);
    const mandatoryMissing = missingRules.filter((r) => r.mandatory);

    if (mandatoryFailures.length > 0) {
      status = 'ineligible';
      mandatoryFailures.forEach((r) => {
        reasons.push(`${r.description} (Expected: ${r.expected}, Found: ${r.actual})`);
      });
    } else if (mandatoryMissing.length > 0) {
      status = 'insufficient_info';
      mandatoryMissing.forEach((r) => {
        reasons.push(`Needs verification: ${r.description} (${r.actual})`);
      });
    } else {
      status = 'eligible';
      reasons.push('Meets all statutory eligibility guidelines.');
    }

    // Compute rule confidence percentage
    const totalRules = schemeRules.length;
    const confidenceScore = totalRules > 0 ? Math.round((passedRules.length / totalRules) * 100) : 100;

    return {
      schemeId: scheme.id,
      schemeCode: scheme.code,
      schemeTitle: scheme.title,
      sector: scheme.sector,
      level: scheme.level,
      state: scheme.state,
      status,
      confidenceScore,
      passedRules,
      failedRules,
      missingRules,
      reasons,
      documentChecklist: scheme.requiredDocuments || [],
      officialUrl: scheme.officialUrl,
      benefitsSummary: scheme.benefits || [],
    };
  }

  /**
   * Evaluates all approved schemes for a given profile
   */
  public static evaluateAll(schemes: Scheme[], profile: CitizenProfile): SchemeEvaluationResult[] {
    // Only evaluate approved schemes for citizens
    const approvedSchemes = schemes.filter((s) => s.status === 'approved');
    return approvedSchemes.map((scheme) => this.evaluateScheme(scheme, profile));
  }

  private static formatExpectedValue(rule: EligibilityRule): string {
    switch (rule.operator) {
      case 'equals':
        return `= ${rule.value}`;
      case 'not_equals':
        return `≠ ${rule.value}`;
      case 'less_than_or_equal':
        return `≤ ${rule.field === 'annualIncome' ? '₹' + Number(rule.value).toLocaleString('en-IN') : rule.value}`;
      case 'greater_than_or_equal':
        return `≥ ${rule.field === 'annualIncome' ? '₹' + Number(rule.value).toLocaleString('en-IN') : rule.value}`;
      case 'in':
        return Array.isArray(rule.value) ? `One of [${rule.value.join(', ')}]` : String(rule.value);
      case 'is_true':
        return 'Yes / Applicable';
      case 'is_false':
        return 'No / Not Applicable';
      default:
        return String(rule.value);
    }
  }

  private static formatActualValue(val: unknown): string {
    if (typeof val === 'boolean') {
      return val ? 'Yes' : 'No';
    }
    if (typeof val === 'number') {
      return val.toLocaleString('en-IN');
    }
    return String(val);
  }
}
