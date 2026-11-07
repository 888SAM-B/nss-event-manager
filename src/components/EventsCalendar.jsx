import React, { useState } from 'react';
import { createPortal } from 'react-dom';

export const getCategoryColor = (category) => {
    const colors = {
        'Special Camp': '#8b5cf6',
        'Blood Donation': '#ef4444',
        'Tree Plantation': '#10b981',
        'Cleanliness Drive': '#f59e0b',
        'Cleanliness Rally': '#f59e0b',
        'Awareness Programme': '#3b82f6',
        'Conference': '#8b5cf6',
        'Seminar': '#6366f1',
        'Workshop': '#ec4899',
        'Sports': '#14b8a6',
        'Cultural': '#a855f7',
        'Health': '#f97316',
        'Environmental': '#22c55e',
        'Social': '#06b6d4',
        'Exhibition': '#e11d48',
        'Road Safety Awareness': '#0ea5e9',
    };
    return colors[category] || '#6366f1';
};

const monthNames = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];

const EventsCalendar = ({ events = [], compact = false, selectedDate = null, onSelectDate = null, onViewEvent = null, onViewReport = null, onViewForm1 = null }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDayEvents, setSelectedDayEvents] = useState(null);
    const [selectedDateLabel, setSelectedDateLabel] = useState('');

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const getEventsForDate = (day) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return events.filter(ev => {
            if (ev.singleDay) return ev.date === dateStr;
            const from = new Date(ev.dateFrom);
            const to = new Date(ev.dateTo);
            const cur = new Date(dateStr);
            return cur >= from && cur <= to;
        });
    };

    const handleDayClick = (day, dayEvents) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (onSelectDate) {
            onSelectDate(dateStr, dayEvents);
        }
        if (dayEvents.length > 0) {
            setSelectedDayEvents(dayEvents);
            setSelectedDateLabel(`${monthNames[month]} ${day}, ${year}`);
        }
    };

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const goToday = () => setCurrentDate(new Date());

    const days = [];
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} style={{ padding: compact ? '2px' : '6px' }} />);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const dayEvents = getEventsForDate(day);
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const today = new Date();
        const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
        const isSelected = selectedDate === dateStr;
        const hasEvents = dayEvents.length > 0;

        days.push(
            <div
                key={day}
                onClick={() => handleDayClick(day, dayEvents)}
                onMouseEnter={e => {
                    if (isSelected) return;
                    if (hasEvents) e.currentTarget.style.background = 'rgba(99,102,241,0.12)';
                }}
                onMouseLeave={e => {
                    if (isSelected) {
                        e.currentTarget.style.background = 'rgba(99,102,241,0.22)';
                    } else {
                        e.currentTarget.style.background = isToday ? 'rgba(99,102,241,0.18)' : 'transparent';
                    }
                }}
                style={{
                    padding: compact ? '2px 1px' : '4px 2px',
                    borderRadius: compact ? '5px' : '8px',
                    background: isSelected ? 'rgba(99,102,241,0.25)' : (isToday ? 'rgba(99,102,241,0.18)' : 'transparent'),
                    border: isSelected ? '1.5px solid var(--brand-600, #4f46e5)' : (isToday ? '1.5px solid rgba(99,102,241,0.5)' : '1.5px solid transparent'),
                    minHeight: compact ? '28px' : '48px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: hasEvents || onSelectDate ? 'pointer' : 'default',
                    transition: 'background 0.15s',
                    overflow: 'hidden',
                    gap: compact ? '1px' : '2px',
                }}
            >
                <span style={{
                    fontSize: compact ? '0.74rem' : '0.85rem',
                    fontWeight: isSelected || isToday ? 700 : 500,
                    color: isSelected ? 'var(--brand-600, #4f46e5)' : (isToday ? 'var(--primary-color)' : 'var(--txt-1)'),
                    lineHeight: 1,
                }}>
                    {day}
                </span>
                {hasEvents && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginTop: compact ? '1px' : '3px' }}>
                        <span
                            title={dayEvents[0].name}
                            style={{
                                width: compact ? '5px' : '6px',
                                height: compact ? '5px' : '6px',
                                borderRadius: '50%',
                                background: getCategoryColor(dayEvents[0].category),
                                flexShrink: 0
                            }}
                        />
                        {dayEvents.length > 1 && (
                            <span style={{ fontSize: compact ? '0.55rem' : '0.62rem', fontWeight: 700, color: 'var(--primary-color, #4f46e5)', lineHeight: 1 }}>
                                +{dayEvents.length - 1}
                            </span>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div>
            {/* Calendar Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: compact ? '0.5rem' : '1rem' }}>
                <button className="btn btn-sm btn-secondary" style={{ padding: compact ? '0.15rem 0.4rem' : undefined, fontSize: compact ? '0.75rem' : undefined }} onClick={prevMonth}>←</button>
                <div style={{ display: 'flex', alignItems: 'center', gap: compact ? '0.4rem' : '0.75rem' }}>
                    <h3 style={{ margin: 0, fontWeight: 700, fontSize: compact ? '0.88rem' : '1.1rem', color: 'var(--txt-1)' }}>
                        {monthNames[month]} {year}
                    </h3>
                    <button className="btn btn-sm btn-secondary" style={{ fontSize: compact ? '0.68rem' : '0.75rem', padding: compact ? '0.15rem 0.35rem' : '0.2rem 0.5rem' }} onClick={goToday}>
                        Today
                    </button>
                </div>
                <button className="btn btn-sm btn-secondary" style={{ padding: compact ? '0.15rem 0.4rem' : undefined, fontSize: compact ? '0.75rem' : undefined }} onClick={nextMonth}>→</button>
            </div>

            {/* Day-of-week headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: compact ? '2px' : '4px', marginBottom: compact ? '2px' : '4px' }}>
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                    <div key={d} style={{
                        textAlign: 'center',
                        fontSize: compact ? '0.64rem' : '0.72rem',
                        fontWeight: 700,
                        color: 'var(--txt-3)',
                        padding: compact ? '2px 0' : '4px 0',
                        letterSpacing: '0.02em',
                        textTransform: 'uppercase',
                    }}>
                        {d}
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: compact ? '2px' : '4px' }}>
                {days}
            </div>

            {/* Legend */}
            <div style={{ marginTop: compact ? '0.5rem' : '1rem', display: 'flex', flexWrap: 'wrap', gap: compact ? '0.35rem' : '0.5rem' }}>
                {[...new Set(events.map(e => e.category).filter(Boolean))].slice(0, compact ? 4 : 8).map(cat => (
                    <span key={cat} style={{
                        display: 'flex', alignItems: 'center', gap: '3px',
                        fontSize: compact ? '0.62rem' : '0.68rem', color: 'var(--txt-2)', fontWeight: 500,
                    }}>
                        <span style={{ width: compact ? 6 : 8, height: compact ? 6 : 8, borderRadius: '50%', background: getCategoryColor(cat), display: 'inline-block' }} />
                        {cat}
                    </span>
                ))}
            </div>

            {/* Day Events Modal */}
            {selectedDayEvents && createPortal(
                <div className="modal-overlay" onClick={() => setSelectedDayEvents(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div className="flex-between mb-4">
                            <div>
                                <h2 className="mb-1">Activities on {selectedDateLabel}</h2>
                                <p className="text-muted mb-0">{selectedDayEvents.length} activit{selectedDayEvents.length !== 1 ? 'ies' : 'y'} scheduled</p>
                            </div>
                            <button className="btn btn-sm btn-secondary" onClick={() => setSelectedDayEvents(null)}>&times;</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {selectedDayEvents.map((event, idx) => (
                                <div key={idx} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', borderLeft: `4px solid ${getCategoryColor(event.category)}` }}>
                                    <div className="flex-between mb-2">
                                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{event.name}</h3>
                                        <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{event.eventCode}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                                        <span className="badge badge-secondary" style={{ fontSize: '0.65rem' }}>{event.category}</span>
                                        {event.level && <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(99,102,241,0.1)', color: 'var(--primary-color)' }}>{event.level}</span>}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.82rem' }}>
                                        <div>
                                            <span style={{ color: 'var(--txt-3)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>Date</span>
                                            <p style={{ margin: 0, fontWeight: 600 }}>
                                                {event.singleDay ? event.date : `${event.dateFrom} → ${event.dateTo}`}
                                            </p>
                                        </div>
                                        {event.venue && (
                                            <div>
                                                <span style={{ color: 'var(--txt-3)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>Venue</span>
                                                <p style={{ margin: 0, fontWeight: 600 }}>{event.venue}</p>
                                            </div>
                                        )}
                                        {event.timeFrom && (
                                            <div>
                                                <span style={{ color: 'var(--txt-3)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>Time</span>
                                                <p style={{ margin: 0, fontWeight: 600 }}>{event.timeFrom}{event.timeTo ? ` – ${event.timeTo}` : ''}</p>
                                            </div>
                                        )}
                                        {event.unitId?.unitNumber && (
                                            <div>
                                                <span style={{ color: 'var(--txt-3)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>Unit</span>
                                                <p style={{ margin: 0, fontWeight: 600 }}>{event.unitId.unitNumber}</p>
                                            </div>
                                        )}
                                        {event.collegeId?.insName && (
                                            <div>
                                                <span style={{ color: 'var(--txt-3)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>College</span>
                                                <p style={{ margin: 0, fontWeight: 600 }}>{event.collegeId.insName}</p>
                                            </div>
                                        )}
                                    </div>
                                    {event.description && (
                                        <p style={{ margin: '0.75rem 0 0', fontSize: '0.82rem', color: 'var(--txt-2)', lineHeight: 1.5 }}>{event.description}</p>
                                    )}
                                    {event.report && (event.report.submittedAt || event.report.outcome || event.report.reportPhotos?.length > 0) && (
                                        <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                                            <div>
                                                <span style={{ color: '#10b981', fontWeight: 700 }}>✓ Report Submitted</span>
                                                {event.report.participantsCount && <span style={{ color: 'var(--txt-2)', marginLeft: '0.75rem' }}>{event.report.participantsCount} participants</span>}
                                            </div>
                                            {onViewReport && (
                                                <button
                                                    className="btn btn-sm btn-outline-success"
                                                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', fontWeight: 600 }}
                                                    onClick={() => { setSelectedDayEvents(null); onViewReport(event); }}
                                                >
                                                    📄 View Official Report
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', flexWrap: 'wrap' }}>
                                        {(event.category === 'Special Camp' || event.specialCampDetails) && onViewForm1 && (
                                            <button
                                                className="btn btn-sm btn-outline-info"
                                                style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', fontWeight: 600 }}
                                                onClick={() => { setSelectedDayEvents(null); onViewForm1(event); }}
                                            >
                                                🏕️ Form 1 Proposal
                                            </button>
                                        )}
                                        {onViewEvent && (
                                            <button
                                                className="btn btn-sm btn-secondary"
                                                style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
                                                onClick={() => { setSelectedDayEvents(null); onViewEvent(event); }}
                                            >
                                                View Details
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setSelectedDayEvents(null)}>Close</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default EventsCalendar;
