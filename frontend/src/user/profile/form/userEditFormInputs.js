import { formValidators } from "../../../validators/formValidators";

export const userEditFormInputs = [
  {
    tag: "First Name",
    name: "firstName",
    type: "text",
    defaultValue: "",
    isRequired: true,
    validators: [formValidators.notEmptyValidator],
  },
  {
    tag: "Last Name",
    name: "lastName",
    type: "text",
    defaultValue: "",
    isRequired: true,
    validators: [formValidators.notEmptyValidator],
  },
  {
    tag: "Studies",
    name: "studies",
    type: "text",
    defaultValue: "",
    isRequired: false,
    validators: [],
  },
  {
    tag: "Job",
    name: "job",
    type: "text",
    defaultValue: "",
    isRequired: false,
    validators: [],
  },
];