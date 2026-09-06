import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

export function PasswordInput({
  value,
  onChange,
  name = 'password',
  id,
  placeholder = 'Password',
  required = false,
  minLength,
  maxLength,
  autoFocus = false,
  style = {},
  inputStyle = {},
  showIcon = false,
  className = '',
  disabled = false,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100%', ...style }} className={`password-input-wrap ${className}`}>
      {showIcon && (
        <Lock
          size={16}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#94a3b8',
            pointerEvents: 'none',
          }}
        />
      )}
      <input
        type={showPassword ? 'text' : 'password'}
        name={name}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        autoFocus={autoFocus}
        disabled={disabled}
        style={{
          width: '100%',
          paddingRight: '2.5rem',
          ...(showIcon ? { paddingLeft: '2.5rem' } : {}),
          ...inputStyle,
        }}
      />
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#94a3b8',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
        }}
        title={showPassword ? 'Hide password' : 'Show password'}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export default PasswordInput;
