export const metadata = {
  title: 'Contact',
  description: 'Contact Byte / ByteBlast via email or GitHub.',
};

export default function ContactPage() {
  return (
    <div className="container section narrow-page">
      <p className="eyebrow">Contact</p>
      <h1>Let’s talk about code, systems, or a project.</h1>

      <div className="card info-card contact-card">
        <h2>Primary contact</h2>
        <p><a href="mailto:contact@byteblast.xyz">contact@byteblast.xyz</a></p>
        <p><a href="https://github.com/gnxbd4vbtm-ops" target="_blank" rel="noreferrer">GitHub profile</a></p>
      </div>
    </div>
  );
}
