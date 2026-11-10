import { item } from '../../assessments/helpers.mjs';

export default {
  A: [
    item(40, "A dental plan pays 80 percent of basic restorative services after the deductible. For a covered $250 filling with the deductible already met, what is the patient’s share?",
      "$50", "$80", "$200", "$250",
      "The patient’s share is 20 percent of the allowed $250, or $50. The covered service category determines the applicable rate."),
    item(40, "A dentist treats the gums and supporting bone around an otherwise intact tooth. Which dental specialty most directly corresponds to that treatment?",
      "Periodontics", "Endodontics", "Orthodontics", "Prosthodontics",
      "Periodontics deals with the structures supporting teeth. Endodontics deals with the interior of a tooth.")
  ],
  B: [
    item(40, "A dental plan has a $1,500 annual benefit maximum and has paid $1,200 this year. It would otherwise pay $450 on the next claim. How much can it pay before the maximum is reached?",
      "$300", "$450", "$750", "$1,200",
      "Only $300 remains in the annual benefit limit. This is a cap on the plan’s payment, unlike a medical out-of-pocket maximum on the member’s costs."),
    item(40, "A parent reviews a benefit schedule that has a separate lifetime maximum for braces. Which category should she look under?",
      "Orthodontics", "Endodontics", "Periodontics", "Diagnostic radiography",
      "Orthodontics addresses tooth alignment. Some plans apply a separate lifetime limit to this category.")
  ],
  C: [
    item(40, "A plan covers preventive cleanings twice per year but major restorations at a different rate. Which service would normally be checked against the preventive frequency limit?",
      "A routine cleaning", "A replacement bridge", "A root canal", "An orthodontic adjustment",
      "Routine prophylaxis is preventive. Bridges, root canals and orthodontic treatment fall into other categories with their own provisions."),
    item(40, "Before an expensive covered bridge is placed, the dentist submits a treatment plan for an estimate of benefits. What is the practical purpose of predetermination?",
      "To estimate coverage and expected patient cost under the plan", "To guarantee eligibility even if coverage ends before the service", "To remove annual benefit maximums", "To transfer the dentist’s license to the insurer",
      "Predetermination helps the patient understand expected benefits. Final payment remains subject to eligibility, the actual treatment and the contract.")
  ]
};
