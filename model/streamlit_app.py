"""
SignalScope — Streamlit App
Ties together Step 1 (Image Input), Step 3 (AI Detection), Step 5 (Robustness Lab),
and Step 8 (Responsible Output) using the REAL trained model — no simulated/fake
predictions anywhere in this file.

Run with:
    streamlit run app.py
"""

import streamlit as st
from PIL import Image
from predicator import DetectorAPI
from robustness import make_variants

MODEL_PATH = "ai_detection_model.pt"
IMG_SIZE = 64  # Must match the resolution used in train.py for this checkpoint

st.set_page_config(page_title="SignalScope", page_icon="🔍", layout="centered")


@st.cache_resource
def load_detector():
    return DetectorAPI(model_weight_path=MODEL_PATH, img_size=IMG_SIZE)


def confidence_bar_label(prob_ai):
    if prob_ai >= 0.5:
        return f"Likely AI-generated — {prob_ai * 100:.1f}% confidence"
    else:
        return f"Likely Real — {(1 - prob_ai) * 100:.1f}% confidence"


st.title("🔍 SignalScope")
st.caption("Real-vs-AI-generated image detection — Core Task + Robustness Lab")

detector = load_detector()

uploaded_file = st.file_uploader("Upload an image", type=["jpg", "jpeg", "png"])

if uploaded_file is not None:
    image = Image.open(uploaded_file).convert("RGB")
    st.image(image, caption="Uploaded image", use_container_width=True)

    with st.spinner("Running detection..."):
        result = detector.predict(image)

    st.subheader("Verdict")
    if result["label"] == "AI-generated":
        st.error(confidence_bar_label(result["ai_probability"]))
    else:
        st.success(confidence_bar_label(result["ai_probability"]))

    st.progress(result["confidence"])
    st.caption(
        "Note: this is a responsible, likelihood-based verdict, not a certainty claim. "
        "Never treat this as absolute proof."
    )

    with st.expander("Raw scores"):
        st.json(result)

    st.divider()
    st.subheader("🧪 Robustness Lab")
    st.write(
        "Tests whether the model's verdict stays stable when this same image is "
        "compressed, resized, or turned into a screenshot-style crop."
    )

    if st.button("Run Robustness Lab"):
        with st.spinner("Testing all 4 variants..."):
            variants = make_variants(image)
            variant_results = {name: detector.predict(img) for name, img in variants.items()}

        cols = st.columns(4)
        variant_order = ["original", "compressed", "resized", "screenshot"]
        for col, name in zip(cols, variant_order):
            with col:
                st.image(variants[name], caption=name.capitalize(), use_container_width=True)
                r = variant_results[name]
                st.metric(label=name.capitalize(), value=f"{r['ai_probability']*100:.1f}% AI")

        labels = [variant_results[v]["label"] for v in variant_order]
        consistent = len(set(labels)) == 1
        drift = abs(variant_results["original"]["ai_probability"] -
                    variant_results["screenshot"]["ai_probability"]) * 100

        st.divider()
        if consistent and drift <= 10:
            st.success(f"✅ Strong robustness — verdict stayed consistent, confidence drift only {drift:.1f}%.")
        elif consistent:
            st.warning(f"⚠️ Moderate robustness — verdict stayed consistent, but confidence drifted {drift:.1f}%.")
        else:
            st.error(f"❌ Weak robustness — the verdict flipped on at least one variant (drift {drift:.1f}%).")

else:
    st.info("Upload an image above to run detection and the robustness lab.")

st.divider()
st.caption(
    "SignalScope never claims 100% certainty. All verdicts are likelihood-based, "
    "responsible outputs (Step 8)."
)
