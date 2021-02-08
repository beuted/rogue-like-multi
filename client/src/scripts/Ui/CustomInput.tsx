import './CustomInput.css';
import * as React from 'react';

const CustomInput = ({ type, name, placeholder, value, onChange, light }: { type?: string, name: string, placeholder: number | string, value: number | string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, light?: boolean },) => {

  return (
    <div className={`form__group ${light ? "light" : ""}`}>
      <input type={type} className="form__field" placeholder={String(placeholder)} name="toto" id="name" value={value} onChange={onChange} />
      {!light ? <label htmlFor="name" className="form__label">{name}</label> : null}
    </div>
  )
}

export default CustomInput
