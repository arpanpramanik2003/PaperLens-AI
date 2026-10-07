export const ease = [0.2, 0, 0, 1] as const;

export const randomProjects = [
  {
    name: "Deep Learning for Medical Imaging",
    summary: "Novel CNN architecture for early disease detection",
    problem: "Improve diagnostic accuracy in X-ray analysis",
    methodology: "Transfer learning with ResNet-50 backbone",
  },
  {
    name: "Natural Language Processing for Code",
    summary: "AI model understanding programming patterns",
    problem: "Automate code review and optimization",
    methodology: "Transformer-based sequence-to-sequence learning",
  },
];

export const randomQuestions = [
  {
    q: "What's the main contribution of this paper?",
    a: "This work proposes a novel approach to tackle scalability issues while maintaining state-of-the-art accuracy.",
  },
  {
    q: "How does this compare to existing solutions?",
    a: "The proposed method achieves 23% faster processing with 15% higher accuracy compared to baseline approaches.",
  },
];

export const detectedGaps = [
  {
    title: "Lack of Adversarial Robustness Evaluation",
    severity: "Critical",
    desc: "The proposed method relies on generating adversarial examples, but the paper fails to investigate the system's robustness against diverse types of attacks.",
    action: "Conduct experiments to evaluate the system's robustness against various types of adversarial attacks.",
  },
  {
    title: "Insufficient Evaluation of Attention-Based Explainability",
    severity: "High",
    desc: "The proposed attention-based explainability method lacks comprehensive evaluation of its effectiveness in explaining model decisions.",
    action: "Conduct a thorough analysis of attention weights and use SHAP values.",
  },
  {
    title: "Inadequate Comparison with Existing Decision Support Systems",
    severity: "High",
    desc: "The paper does not provide a systematic comparison with existing medical decision support systems.",
    action: "Conduct a thorough review and comparative benchmark against existing systems.",
  },
  {
    title: "Missing Privacy & Safety Analysis",
    severity: "Medium",
    desc: "While designed for clinical use, there is no discussion of privacy-preserving techniques or HIPAA compliance.",
    action: "Implement privacy-preserving mechanisms and conduct security audits.",
  },
];

export const projectDescriptions = [
  "Design and development of a medical decision support system using deep reinforcement learning algorithms to generate adversarial examples, while integrating attention-based explainability methods for improved model interpretability.",
];

export const experimentSteps = [
  {
    num: 1,
    title: "Dataset Selection & Curation",
    desc: "Collect and standardize a diverse dataset from public sources (TCGA, Kaggle) and in-house medical records (~1000 samples).",
    code: "Dataset size: 1000, Data split ratio: 0.8, 0.1, 0.1 for training, validation, and test sets",
    risk: "Risk: Data imbalance may affect model performance",
  },
  {
    num: 2,
    title: "Advanced Preprocessing & Feature Engineering",
    desc: "Apply normalization, augmentation, and custom feature extraction. Implement histogram equalization and noise reduction.",
    code: "Normalization type: Z-score, Augmentation: rotation, flip, zoom",
    risk: null,
  },
  {
    num: 3,
    title: "Custom Model Architecture Design",
    desc: "Design a hybrid CNN-based architecture combining transfer learning with custom attention layers for interpretability.",
    code: "Base model: ResNet-50, Custom layers: 3, Attention: MultiHeadAttention",
    risk: null,
  },
  {
    num: 4,
    title: "Training Logic & Optimization",
    desc: "Configure training with appropriate loss functions, Adam optimizer, and learning rate scheduling.",
    code: "Optimizer: Adam, LR: 0.001, Batch size: 32, Epochs: 100",
    risk: null,
  },
];

export const researchTopics = ["Brain Tumor", "Cardiac Imaging", "Alzheimer's Detection"];
export const difficultyLevels = ["Beginner", "Intermediate", "Advanced", "Expert"];
