function Card({ children }) {
return (
    <div
    style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        padding: '16px',
        border: '1px solid #EAEAEA',
    }}
    >
    {children}
    </div>
)
}

export default Card