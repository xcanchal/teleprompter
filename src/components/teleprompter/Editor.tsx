interface EditorProps {
  script: string;
  placeholder: string;
  onChange: (script: string) => void;
}

export function Editor({ script, placeholder, onChange }: EditorProps) {
  return (
    <div className="tp-glass">
      <textarea
        className="tp-editor"
        value={script}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
      />
    </div>
  );
}
