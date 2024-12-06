import React, { useContext, useEffect, useState } from "react";
import { CenterContainer } from "../components/containers";
import styled from "styled-components";
import { useIntl } from "react-intl";
import Cloud from "../images/cloud.svg";
import { Button } from "../components/buttons";
import { AppContext } from "../App";
import { checkAccessToken } from "../api";
import { useNavigate } from "react-router-dom";

const Icon = styled.img.attrs(() => {
  return { src: Cloud };
})`
  margin-bottom: 10px;
  width: 200px;
  height: 200px;
  filter: drop-shadow(0 0 8px #ffffff);
`;
const RegisterButton = styled(Button)`
  width: auto;
  padding-left: 10px;
  padding-right: 10px;
`;

function Index() {
  const intl = useIntl();
  const context = useContext(AppContext);
  const navigate = useNavigate();
  const [message, setMesssage] = useState<string>();

  useEffect(() => {
    document.title = intl.formatMessage({ id: "cloud" });
    checkAccessToken(context).then((accessToken) => {
      if (!accessToken) {
        window.location.assign(
          `https://${
            process.env.REACT_APP_URL
          }/signin?next=${encodeURIComponent(
            `https://cloud.${process.env.REACT_APP_URL}`
          )}`
        );
      }
    });
  }, [context]);
  useEffect(() => {
    if (!context.accessToken) return;

    fetch(`https://cloud-back.${process.env.REACT_APP_URL}/registered`, {
      method: "POST",
      headers: { Authorization: `Bearer ${context.accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status && data.registered) {
          return navigate("/dir");
        }
      });
  }, [context.accessToken]);

  return (
    <CenterContainer>
      <div>{message}</div>
      <Icon></Icon>
      <h1>{intl.formatMessage({ id: "cloud" })}</h1>
      <RegisterButton
        onClick={() => {
          fetch(`https://cloud-back.${process.env.REACT_APP_URL}/register`, {
            method: "POST",
            headers: { Authorization: `Bearer ${context.accessToken}` },
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.status) {
                return navigate("/dir");
              }
              setMesssage(intl.formatMessage({ id: data.reason }));
            });
        }}
      >
        {intl.formatMessage({ id: "register" })}
      </RegisterButton>
    </CenterContainer>
  );
}

export { Index };
