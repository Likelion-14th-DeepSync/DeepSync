function MobileLayout({ children }) {
return (
    <div
    style={{
        width: '100%',
        maxWidth: '430px',
        minHeight: '100vh',
        margin: '0 auto',
        backgroundColor: '#FFFFFF',
    }}
    >
    {children}
    </div>
)
}

export default MobileLayout