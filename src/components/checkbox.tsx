import React from "react";

import styled from "styled-components";

const CheckInput = styled.input.attrs(() => ({ type: "checkbox" }))`
  margin-right: 5px;
`;
const Checkbox = ({ children, name }: { children: string; name: string }) => (
  <label>
    <CheckInput name={name}></CheckInput>
    {children}
  </label>
);

export { Checkbox };
