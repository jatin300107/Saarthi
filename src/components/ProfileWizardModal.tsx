import React, { useState } from 'react';
import { CitizenProfile } from '../types';
import { X, Sparkles, Check, ArrowRight, ArrowLeft, UserCheck, ShieldCheck } from 'lucide-react';

interface ProfileWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (profile: CitizenProfile) => void;
  loading: boolean;
  initialProfile?: CitizenProfile;
}

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Delhi',
  'Gujarat',
  'Haryana',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'West Bengal',
];

export const ProfileWizardModal: React.FC<ProfileWizardModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  initialProfile,
}) => {
  const [step, setStep] = useState<number>(1);
  const [profile, setProfile] = useState<CitizenProfile>(
    initialProfile || {
      state: 'Uttar Pradesh',
      age: 28,
      gender: 'all',
      socialCategory: 'OBC',
      annualIncome: 180000,
      occupation: 'Farmer',
      landHoldingHectares: 1.5,
      isBplCardHolder: false,
      isDifferentlyAbled: false,
      educationStatus: 'school',
    }
  );

  if (!isOpen) return null;

  // Preset sample profiles for instant testing
  const applyPreset = (presetName: string) => {
    if (presetName === 'farmer') {
      setProfile({
        state: 'Uttar Pradesh',
        age: 34,
        gender: 'male',
        socialCategory: 'OBC',
        annualIncome: 120000,
        occupation: 'Farmer',
        landHoldingHectares: 1.2,
        isBplCardHolder: false,
        isDifferentlyAbled: false,
        educationStatus: 'school',
      });
    } else if (presetName === 'student_female') {
      setProfile({
        state: 'Maharashtra',
        age: 20,
        gender: 'female',
        socialCategory: 'General',
        annualIncome: 280000,
        occupation: 'Student',
        landHoldingHectares: 0,
        isBplCardHolder: false,
        isDifferentlyAbled: false,
        educationStatus: 'undergraduate',
      });
    } else if (presetName === 'bpl_rural') {
      setProfile({
        state: 'Bihar',
        age: 42,
        gender: 'female',
        socialCategory: 'SC',
        annualIncome: 85000,
        occupation: 'Self-Employed',
        landHoldingHectares: 0,
        isBplCardHolder: true,
        isDifferentlyAbled: false,
        educationStatus: 'none',
      });
    } else if (presetName === 'msme_youth') {
      setProfile({
        state: 'Uttar Pradesh',
        age: 24,
        gender: 'male',
        socialCategory: 'General',
        annualIncome: 210000,
        occupation: 'Small Business Owner / Artisan',
        landHoldingHectares: 0,
        isBplCardHolder: false,
        isDifferentlyAbled: false,
        educationStatus: 'vocational',
      });
    }
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else onSubmit(profile);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Citizen Eligibility Wizard</h2>
              <p className="text-xs text-slate-400">Step {step} of 3 · Deterministic Rule Matching</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator bar */}
        <div className="grid grid-cols-3 bg-slate-100 border-b border-slate-200 text-xs font-semibold text-center">
          <div className={`py-2 px-3 border-r border-slate-200 ${step === 1 ? 'bg-blue-900 text-white' : 'text-slate-600'}`}>
            1. Demographics
          </div>
          <div className={`py-2 px-3 border-r border-slate-200 ${step === 2 ? 'bg-blue-900 text-white' : 'text-slate-600'}`}>
            2. Income & Household
          </div>
          <div className={`py-2 px-3 ${step === 3 ? 'bg-blue-900 text-white' : 'text-slate-600'}`}>
            3. Occupation & Criteria
          </div>
        </div>

        {/* Sample Profile Presets toolbar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Quick Test Presets:</span>
          <button
            onClick={() => applyPreset('farmer')}
            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-300 font-medium cursor-pointer"
          >
            Small Farmer (UP)
          </button>
          <button
            onClick={() => applyPreset('student_female')}
            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-300 font-medium cursor-pointer"
          >
            Female Student (MH)
          </button>
          <button
            onClick={() => applyPreset('bpl_rural')}
            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-300 font-medium cursor-pointer"
          >
            BPL Rural Family (BR)
          </button>
          <button
            onClick={() => applyPreset('msme_youth')}
            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-300 font-medium cursor-pointer"
          >
            Young Artisan (UP)
          </button>
        </div>

        {/* Wizard Form Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Resident State / Union Territory *
                </label>
                <select
                  value={profile.state}
                  onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                  className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Determines eligibility for both Central schemes and State-specific government initiatives.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Age of Applicant (Years) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="110"
                    value={profile.age || ''}
                    onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900"
                    placeholder="e.g. 28"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Gender Identity *
                  </label>
                  <select
                    value={profile.gender || 'all'}
                    onChange={(e) => setProfile({ ...profile, gender: e.target.value as any })}
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="transgender">Transgender</option>
                    <option value="all">Prefer Not to Specify</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Social Reservation Category
                </label>
                <select
                  value={profile.socialCategory || 'General'}
                  onChange={(e) => setProfile({ ...profile, socialCategory: e.target.value as any })}
                  className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900"
                >
                  <option value="General">General / Unreserved</option>
                  <option value="OBC">Other Backward Class (OBC)</option>
                  <option value="SC">Scheduled Caste (SC)</option>
                  <option value="ST">Scheduled Tribe (ST)</option>
                  <option value="EWS">Economically Weaker Section (EWS)</option>
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Total Annual Household Income (₹ INR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-slate-400 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="1000"
                    value={profile.annualIncome ?? ''}
                    onChange={(e) => setProfile({ ...profile, annualIncome: Number(e.target.value) })}
                    className="w-full pl-8 pr-4 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 font-mono"
                    placeholder="e.g. 180000"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Gross combined annual family income as certified by Revenue Authority or Tehsildar.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.isBplCardHolder || false}
                    onChange={(e) => setProfile({ ...profile, isBplCardHolder: e.target.checked })}
                    className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-900"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-900 block">
                      BPL / Ration Cardholder (SECC Deprivation)
                    </span>
                    <span className="text-xs text-slate-500">
                      Possess Below Poverty Line (BPL), Antyodaya Anna Yojana (AAY), or Priority Household ration card.
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.isDifferentlyAbled || false}
                    onChange={(e) => setProfile({ ...profile, isDifferentlyAbled: e.target.checked })}
                    className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-900"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-900 block">
                      Person with Disability (Divyangjan)
                    </span>
                    <span className="text-xs text-slate-500">
                      Possess UDID card or disability certificate (≥40% disability).
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Occupation / Vocation *
                </label>
                <select
                  value={profile.occupation || 'Farmer'}
                  onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                  className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900"
                >
                  <option value="Farmer">Farmer / Agriculturalist</option>
                  <option value="Student">Student (Enrolled in School/College)</option>
                  <option value="Small Business Owner / Artisan">Small Business Owner / Artisan / Micro-Entrepreneur</option>
                  <option value="Self-Employed">Self-Employed / Freelancer / Daily Wage</option>
                  <option value="Salaried">Salaried Employee (Private / Informal)</option>
                  <option value="Unemployed">Unemployed / Jobseeker</option>
                </select>
              </div>

              {profile.occupation === 'Farmer' && (
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 space-y-2">
                  <label className="block text-xs font-bold text-emerald-950">
                    Cultivable Agricultural Landholding (Hectares) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={profile.landHoldingHectares ?? ''}
                      onChange={(e) => setProfile({ ...profile, landHoldingHectares: Number(e.target.value) })}
                      className="w-full py-2 px-3 text-sm bg-white border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-700 font-mono"
                      placeholder="e.g. 1.5"
                    />
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    PM-KISAN and agrarian schemes cap small/marginal landholdings at 2.0 hectares (approx 5 acres).
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Educational Enrollment Status
                </label>
                <select
                  value={profile.educationStatus || 'school'}
                  onChange={(e) => setProfile({ ...profile, educationStatus: e.target.value as any })}
                  className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900"
                >
                  <option value="none">No Formal Schooling</option>
                  <option value="school">Primary / Secondary / High School</option>
                  <option value="vocational">Vocational / ITI / Diploma</option>
                  <option value="undergraduate">Undergraduate (BA, BSc, BTech, BCom, etc.)</option>
                  <option value="postgraduate">Postgraduate / Research Scholar</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={handleBack}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-lg border border-slate-300 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Previous
            </button>
          ) : (
            <button
              onClick={onClose}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              Cancel
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={loading}
            className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Evaluating Rules...
              </span>
            ) : step < 3 ? (
              <>
                Next Step
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Evaluate My Eligibility
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
