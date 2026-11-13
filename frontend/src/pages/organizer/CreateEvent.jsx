import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';

const fieldTypes = ['text', 'email', 'number', 'textarea', 'dropdown', 'checkbox'];

export default function CreateEvent() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        name: '', description: '', type: 'normal', eligibility: 'all',
        startDate: '', endDate: '', registrationDeadline: '',
        registrationLimit: 0, registrationFee: 0, tags: '',
        isTeamEvent: false, minTeamSize: 2, maxTeamSize: 4,
        customForm: [], merchandiseItems: [],
    });

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    // Custom form builder
    const addField = () => {
        setForm({ ...form, customForm: [...form.customForm, { label: '', fieldType: 'text', required: false, options: [] }] });
    };

    const updateField = (idx, key, val) => {
        const fields = [...form.customForm];
        fields[idx] = { ...fields[idx], [key]: val };
        setForm({ ...form, customForm: fields });
    };

    const removeField = (idx) => {
        setForm({ ...form, customForm: form.customForm.filter((_, i) => i !== idx) });
    };

    // Merchandise builder
    const addMerchItem = () => {
        setForm({
            ...form,
            merchandiseItems: [...form.merchandiseItems, { name: '', description: '', price: 0, stockQuantity: 0, sizes: '', colors: '', purchaseLimitPerParticipant: 5 }],
        });
    };

    const updateMerchItem = (idx, key, val) => {
        const items = [...form.merchandiseItems];
        items[idx] = { ...items[idx], [key]: val };
        setForm({ ...form, merchandiseItems: items });
    };

    const removeMerchItem = (idx) => {
        setForm({ ...form, merchandiseItems: form.merchandiseItems.filter((_, i) => i !== idx) });
    };

    const handleSubmit = async () => {
        setSaving(true);
        setError('');
        try {
            const payload = {
                ...form,
                tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
                registrationLimit: Number(form.registrationLimit),
                registrationFee: Number(form.registrationFee),
                isTeamEvent: form.isTeamEvent,
                teamSize: form.isTeamEvent ? { min: Number(form.minTeamSize), max: Number(form.maxTeamSize) } : undefined,
            };

            // Process custom form options
            if (form.type === 'normal') {
                payload.customForm = form.customForm.map((f) => ({
                    ...f,
                    options: typeof f.options === 'string' ? f.options.split(',').map((o) => o.trim()).filter(Boolean) : f.options,
                }));
                delete payload.merchandiseItems;
            }

            // Process merchandise items
            if (form.type === 'merchandise') {
                payload.merchandiseItems = form.merchandiseItems.map((item) => ({
                    ...item,
                    price: Number(item.price),
                    stockQuantity: Number(item.stockQuantity),
                    purchaseLimitPerParticipant: Number(item.purchaseLimitPerParticipant),
                    sizes: typeof item.sizes === 'string' ? item.sizes.split(',').map((s) => s.trim()).filter(Boolean) : item.sizes,
                    colors: typeof item.colors === 'string' ? item.colors.split(',').map((c) => c.trim()).filter(Boolean) : item.colors,
                }));
                delete payload.customForm;
            }

            await API.post('/organizer/events', payload);
            navigate('/organizer/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create event');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="page-container page-narrow">
            <div className="page-header">
                <h1>Create Event</h1>
                <p>Step {step} of 3 — {['Basic information', step === 2 && form.type === 'merchandise' ? 'Merchandise items' : 'Registration form', 'Preview & create'][step - 1]}</p>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {/* Progress */}
            <div className="stepper">
                {['Basics', form.type === 'merchandise' ? 'Items' : 'Form', 'Preview'].map((label, i) => (
                    <div key={label} className={`step ${i + 1 <= step ? 'done' : ''}`}>
                        <div className="step-bar" />
                        <div className="step-label">{i + 1}. {label}</div>
                    </div>
                ))}
            </div>

            <div className="glass-card">
                {/* Step 1: Basic Info */}
                {step === 1 && (
                    <>
                        <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>Basic Information</h3>

                        <div className="form-group">
                            <label>Event Name *</label>
                            <input name="name" className="form-input" placeholder="My Awesome Event" value={form.name} onChange={handleChange} required />
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea name="description" className="form-input" placeholder="Describe your event..." value={form.description} onChange={handleChange} rows={4} />
                        </div>

                        <div className="form-row cols-2">
                            <div className="form-group">
                                <label>Event Type *</label>
                                <select name="type" className="form-input" value={form.type} onChange={handleChange}>
                                    <option value="normal">Normal Event</option>
                                    <option value="merchandise">Merchandise</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Eligibility *</label>
                                <select name="eligibility" className="form-input" value={form.eligibility} onChange={handleChange}>
                                    <option value="all">Open to All</option>
                                    <option value="iiit">IIIT Only</option>
                                    <option value="non-iiit">Non-IIIT Only</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row cols-3">
                            <div className="form-group">
                                <label>Start Date *</label>
                                <input name="startDate" type="date" className="form-input" value={form.startDate} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>End Date *</label>
                                <input name="endDate" type="date" className="form-input" value={form.endDate} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Reg. Deadline *</label>
                                <input name="registrationDeadline" type="date" className="form-input" value={form.registrationDeadline} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="form-row cols-2">
                            <div className="form-group">
                                <label>Reg. Limit (0 = unlimited)</label>
                                <input name="registrationLimit" type="number" className="form-input" value={form.registrationLimit} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Reg. Fee (₹)</label>
                                <input name="registrationFee" type="number" className="form-input" value={form.registrationFee} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Tags (comma-separated)</label>
                            <input name="tags" className="form-input" placeholder="tech, coding, hackathon" value={form.tags} onChange={handleChange} />
                        </div>

                        {/* Team Event Settings */}
                        <div className="toggle-panel">
                            <label className="check-label" style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: form.isTeamEvent ? '1rem' : 0 }}>
                                <input type="checkbox" checked={form.isTeamEvent} onChange={(e) => setForm({ ...form, isTeamEvent: e.target.checked })} />
                                👥 Team Event
                            </label>
                            {form.isTeamEvent && (
                                <div className="form-row cols-2">
                                    <div className="form-group">
                                        <label>Min Team Size</label>
                                        <input name="minTeamSize" type="number" className="form-input" min="2" value={form.minTeamSize} onChange={handleChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Max Team Size</label>
                                        <input name="maxTeamSize" type="number" className="form-input" min="2" value={form.maxTeamSize} onChange={handleChange} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <button className="btn btn-primary" onClick={() => setStep(2)}>Next →</button>
                    </>
                )}

                {/* Step 2: Form Builder / Merch */}
                {step === 2 && (
                    <>
                        {form.type === 'normal' ? (
                            <>
                                <div className="page-header-row" style={{ alignItems: 'center', marginBottom: '1.25rem' }}>
                                    <h3>Registration Form Builder</h3>
                                    <button className="btn btn-secondary btn-sm" onClick={addField}>+ Add Field</button>
                                </div>

                                {form.customForm.length === 0 && (
                                    <p className="empty-state" style={{ padding: '1.5rem', marginBottom: '1rem', fontSize: 'var(--font-sm)' }}>No custom fields yet. Click "+ Add Field" to build your registration form.</p>
                                )}

                                {form.customForm.map((field, idx) => (
                                    <div key={idx} className="builder-item">
                                        <div className="builder-item-head">
                                            <span>Field #{idx + 1}</span>
                                            <button className="btn btn-danger btn-sm" aria-label="Remove field" onClick={() => removeField(idx)}>✕</button>
                                        </div>
                                        <div className="form-row cols-2-1">
                                            <div className="form-group">
                                                <label>Label</label>
                                                <input className="form-input" value={field.label} onChange={(e) => updateField(idx, 'label', e.target.value)} placeholder="Field label" />
                                            </div>
                                            <div className="form-group">
                                                <label>Type</label>
                                                <select className="form-input" value={field.fieldType} onChange={(e) => updateField(idx, 'fieldType', e.target.value)}>
                                                    {fieldTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        {(field.fieldType === 'dropdown' || field.fieldType === 'checkbox') && (
                                            <div className="form-group">
                                                <label>Options (comma-separated)</label>
                                                <input className="form-input" value={typeof field.options === 'string' ? field.options : field.options.join(', ')} onChange={(e) => updateField(idx, 'options', e.target.value)} placeholder="Option 1, Option 2, Option 3" />
                                            </div>
                                        )}
                                        <label className="check-label">
                                            <input type="checkbox" checked={field.required} onChange={(e) => updateField(idx, 'required', e.target.checked)} /> Required
                                        </label>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <>
                                <div className="page-header-row" style={{ alignItems: 'center', marginBottom: '1.25rem' }}>
                                    <h3>Merchandise Items</h3>
                                    <button className="btn btn-secondary btn-sm" onClick={addMerchItem}>+ Add Item</button>
                                </div>

                                {form.merchandiseItems.length === 0 && (
                                    <p className="empty-state" style={{ padding: '1.5rem', marginBottom: '1rem', fontSize: 'var(--font-sm)' }}>No items yet. Add merchandise items for participants to purchase.</p>
                                )}

                                {form.merchandiseItems.map((item, idx) => (
                                    <div key={idx} className="builder-item">
                                        <div className="builder-item-head">
                                            <span>Item #{idx + 1}</span>
                                            <button className="btn btn-danger btn-sm" aria-label="Remove item" onClick={() => removeMerchItem(idx)}>✕</button>
                                        </div>
                                        <div className="form-row cols-2-1">
                                            <div className="form-group">
                                                <label>Item Name</label>
                                                <input className="form-input" value={item.name} onChange={(e) => updateMerchItem(idx, 'name', e.target.value)} placeholder="T-Shirt" />
                                            </div>
                                            <div className="form-group">
                                                <label>Price (₹)</label>
                                                <input type="number" className="form-input" value={item.price} onChange={(e) => updateMerchItem(idx, 'price', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="form-row cols-3">
                                            <div className="form-group">
                                                <label>Stock</label>
                                                <input type="number" className="form-input" value={item.stockQuantity} onChange={(e) => updateMerchItem(idx, 'stockQuantity', e.target.value)} />
                                            </div>
                                            <div className="form-group">
                                                <label>Limit/Person</label>
                                                <input type="number" className="form-input" value={item.purchaseLimitPerParticipant} onChange={(e) => updateMerchItem(idx, 'purchaseLimitPerParticipant', e.target.value)} />
                                            </div>
                                            <div className="form-group">
                                                <label>Sizes (csv)</label>
                                                <input className="form-input" value={item.sizes} onChange={(e) => updateMerchItem(idx, 'sizes', e.target.value)} placeholder="S, M, L, XL" />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Colors (csv)</label>
                                            <input className="form-input" value={item.colors} onChange={(e) => updateMerchItem(idx, 'colors', e.target.value)} placeholder="Black, White, Red" />
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}

                        <div className="cluster" style={{ gap: '0.75rem', marginTop: '1rem' }}>
                            <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
                            <button className="btn btn-primary" onClick={() => setStep(3)}>Preview →</button>
                        </div>
                    </>
                )}

                {/* Step 3: Preview */}
                {step === 3 && (
                    <>
                        <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>Preview & Create</h3>

                        <div className="info-list">
                            <div><span className="k">Name</span><span className="v">{form.name || '—'}</span></div>
                            <div><span className="k">Type</span><span className="v">{form.type}</span></div>
                            <div><span className="k">Eligibility</span><span className="v">{form.eligibility}</span></div>
                            <div><span className="k">Dates</span><span className="v">{form.startDate || '—'} → {form.endDate || '—'}</span></div>
                            <div><span className="k">Deadline</span><span className="v">{form.registrationDeadline || '—'}</span></div>
                            <div><span className="k">Limit</span><span className="v">{form.registrationLimit || 'Unlimited'}</span></div>
                            <div><span className="k">Fee</span><span className="v">₹{form.registrationFee}</span></div>
                            <div><span className="k">Tags</span><span className="v">{form.tags || 'None'}</span></div>
                            {form.isTeamEvent && <div><span className="k">Team event</span><span className="v">{form.minTeamSize}–{form.maxTeamSize} members</span></div>}
                            {form.type === 'normal' && <div><span className="k">Custom fields</span><span className="v">{form.customForm.length}</span></div>}
                            {form.type === 'merchandise' && <div><span className="k">Merch items</span><span className="v">{form.merchandiseItems.length}</span></div>}
                        </div>

                        <p className="callout text-xs text-secondary" style={{ marginTop: '1.25rem' }}>
                            The event will be created as a <strong>Draft</strong>. You can publish it later from the event detail page.
                        </p>

                        <div className="cluster" style={{ gap: '0.75rem', marginTop: '1.5rem' }}>
                            <button className="btn btn-secondary" onClick={() => setStep(2)}>← Back</button>
                            <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={saving}>
                                {saving ? 'Creating...' : '🚀 Create Event'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
