function Button({ children, onClick, disabled = false }) {
return (
    <button
    onClick={onClick}
    disabled={disabled}
    style={{
        width: '100%',
        height: '52px',
        borderRadius: '16px',
        backgroundColor: disabled ? '#D9D9D9' : '#6C5CE7',
        color: '#FFFFFF',
        fontSize: '14px',
        fontWeight: 600,
    }}
    >
    {children}
    </button>
)
}

export default Button