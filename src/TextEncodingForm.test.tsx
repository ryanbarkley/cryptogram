import React from "react";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { within } from "@testing-library/dom";
import { axe } from "jest-axe";
import faker from "faker";
import { BrowserRouter as Router } from "react-router-dom";
import TextEncodingForm from "./TextEncodingForm";
import { transformText } from "./Algorithms";

const Wrapper: React.ComponentType = ({ children }) => {
  return <Router>{children}</Router>;
};

function renderEncodingForm() {
  const form = render(<TextEncodingForm />, { wrapper: Wrapper });
  const inputs = {
    algorithmSelection: form.getByRole("button", { name: /algorithm/i }),
    sourceText: form.getByLabelText(/source message/i),
    transformedText: form.getByLabelText(/encoded message/i),
  };
  return { ...form, inputs };
}

test("renders a text encoding form", () => {
  const { getByLabelText, getByRole } = renderEncodingForm();

  expect(getByRole("button", { name: /algorithm/i })).toBeInTheDocument();
  expect(getByRole("group", { name: "Algorithm Mode" })).toBeInTheDocument();
  expect(getByLabelText(/source message/i)).toBeInTheDocument();
  expect(getByLabelText(/encoded message/i)).toBeInTheDocument();
});

test("follows basic accessibility best practices", async () => {
  const { container } = renderEncodingForm();
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

test("automatically transforms the source message when entered", () => {
  const { inputs } = renderEncodingForm();
  const rawText = faker.lorem.sentence().trim();
  const encodedText = transformText(rawText, "base64", "encode");

  userEvent.type(inputs.sourceText, rawText);
  expect(inputs.transformedText).toHaveTextContent(encodedText);
});

test("allows the algorithm to be changed", () => {
  const { getByText, inputs } = renderEncodingForm();
  const hexadecimalOption = () => getByText(/hexadecimal/i);
  const rawText = faker.lorem.sentence().trim();
  const encodedText = transformText(rawText, "hex", "encode");

  expect(inputs.algorithmSelection).not.toHaveTextContent(/hexadecimal/i);
  userEvent.click(inputs.algorithmSelection);
  userEvent.click(hexadecimalOption());
  expect(inputs.algorithmSelection).toHaveTextContent(/hexadecimal/i);
  userEvent.type(inputs.sourceText, rawText);
  expect(inputs.transformedText).toHaveTextContent(encodedText);
});
test("allows the algorithm mode to be changed", () => {
  const { getByRole, inputs } = renderEncodingForm();
  const modeSelection = getByRole("group", { name: "Algorithm Mode" });
  const selectedMode = () =>
    within(modeSelection).getByRole("button", {
      pressed: true,
    });
  const decodeOption = within(modeSelection).getByLabelText(/decode/i);
  const rawText = faker.lorem.sentence().trim();
  const encodedText = transformText(rawText, "base64", "encode");

  expect(selectedMode()).toHaveTextContent(/encode/i);
  userEvent.click(decodeOption);
  expect(selectedMode()).toHaveTextContent(/decode/i);
  userEvent.type(inputs.sourceText, encodedText);
  expect(inputs.transformedText).toHaveTextContent(rawText);
});

test("renders a link to learn more about supported algorithms", () => {
  const { getByRole } = renderEncodingForm();
  const linkElement = getByRole("link", { name: /learn more/i });
  expect(linkElement).toBeInTheDocument();
});
