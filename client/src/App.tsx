import React, { useMemo, useState } from 'react';
import { useSchema } from './useSchema';
import type { Field, Step } from './types';
import { generateOtp, verifyOtp, validatePan, submitAll } from './api';

function Progress({ current }: { current: number }) {
  return (
    <div className="progress">
      <div className={"step " + (current > 0 ? "done" : "active")}></div>
      <div className={"step " + (current > 1 ? "done" : "")}></div>
    </div>
  );
}

function TextField({ field, value, onChange, error }:{ field: Field, value: string, onChange: (v:string)=>void, error?: string }){
  return (
    <div>
      <label className="label">{field.label}</label>
      <input
        className="input"
        placeholder={field.placeholder || ''}
        value={value}
        onChange={(e)=> onChange(e.target.value)}
      />
      {error && <div className="error">{error}</div>}
    </div>
  );
}

function CheckboxField({ field, checked, onChange, error }:{ field: Field, checked: boolean, onChange: (v:boolean)=>void, error?: string }){
  return (
    <div>
      <label className="label">{field.label}</label>
      <div className="checkbox-row">
        <input
          className="checkbox"
          type="checkbox"
          checked={checked}
          onChange={(e)=> onChange(e.target.checked)}
          style={{ width: 20, height: 20 }}
        />
        <span className="small">Required to proceed</span>
      </div>
      {error && <div className="error">{error}</div>}
    </div>
  );
}

function validateField(field: Field, value: any) {
  if (field.required && (value === '' || value === false || value == null)) {
    return 'This field is required';
  }
  if (field.validation?.regex) {
    const re = new RegExp(field.validation.regex);
    if (!re.test(String(value || ''))) {
      return field.validation.message || 'Invalid';
    }
  }
  return null;
}

export function App(){
  const { schema, loading } = useSchema();
  const [currentStep, setCurrentStep] = useState(0);
  const [values, setValues] = useState<any>({});
  const [errors, setErrors] = useState<Record<string,string|undefined>>({});
  const [otpToken, setOtpToken] = useState<string>('');
  const [devOtp, setDevOtp] = useState<string>(''); // show in dev

  const step: Step | undefined = useMemo(()=> schema?.steps[currentStep], [schema, currentStep]);

  if (loading || !schema || !step) return <div className="container"><div className="card">Loading...</div></div>;

  const setValue = (key: string, v: any) => setValues((s:any)=> ({...s, [key]: v}));

  const onGenerateOtp = async () => {
    // validate local fields first
    const localErrs: Record<string,string|undefined> = {};
    for (const f of step.fields) {
      const msg = validateField(f, values[f.key]);
      if (msg) localErrs[f.key] = msg;
    }
    setErrors(localErrs);
    if (Object.keys(localErrs).length) return;

    const resp = await generateOtp({
      aadhaarNumber: values.aadhaarNumber,
      nameAsPerAadhaar: values.nameAsPerAadhaar,
      declarationConsent: values.declarationConsent
    });
    if (!resp.ok) return;
    setOtpToken(resp.token);
    if (resp.otp) setDevOtp(resp.otp);
    alert('OTP generated. Check console or DEV OTP box below.');
  };

  const onVerifyOtp = async () => {
    const otp = prompt('Enter 6-digit OTP (in dev, see below):') || '';
    const resp = await verifyOtp({ token: otpToken, otp });
    if (!resp.ok) { alert('Incorrect OTP'); return; }
    setCurrentStep(1);
  };

  const onValidatePan = async () => {
    const pan = String(values.panNumber || '').toUpperCase();
    const resp = await validatePan({ panNumber: pan });
    if (!resp.ok) { alert('Invalid PAN'); return; }
    setValues((s:any)=> ({...s, panNumber: resp.pan}));
    alert('PAN looks valid');
  };

  const onSubmit = async () => {
    const resp = await submitAll({ token: otpToken, panNumber: values.panNumber });
    if (resp.ok) {
      alert('Saved. ID: ' + resp.id);
      window.location.reload();
    } else {
      alert(resp.error || 'Submission failed');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="h1">{schema.meta.title}</h1>
        <p className="p">Source: {schema.meta.source}</p>
        <Progress current={currentStep} />

        {currentStep === 0 && (
          <>
            <div className="row row-2">
              {step.fields.map(f => f.type === 'text' ? (
                <TextField
                  key={f.key}
                  field={f}
                  value={values[f.key] || ''}
                  onChange={(v)=> setValue(f.key, v)}
                  error={errors[f.key]}
                />
              ) : (
                <CheckboxField
                  key={f.key}
                  field={f}
                  checked={!!values[f.key]}
                  onChange={(v)=> setValue(f.key, v)}
                  error={errors[f.key]}
                />
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn" onClick={onGenerateOtp} disabled={!values.declarationConsent}>Validate & Generate OTP</button>
              <button className="btn" onClick={onVerifyOtp} disabled={!otpToken}>Verify OTP</button>
            </div>

            {devOtp && <div className="footer">DEV OTP: {devOtp}</div>}
          </>
        )}

        {currentStep === 1 && (
          <>
            <div className="row">
              <TextField
                field={step.fields[0]}
                value={(values.panNumber || '').toUpperCase()}
                onChange={(v)=> setValue('panNumber', v.toUpperCase())}
                error={errors.panNumber}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn" onClick={onValidatePan}>Validate PAN</button>
              <button className="btn" onClick={onSubmit}>Submit</button>
            </div>
          </>
        )}

        <div className="footer">Demo build for learning purposes.</div>
      </div>
    </div>
  );
}
