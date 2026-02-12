from flask import Blueprint, jsonify, request
from app.extensions import db
from app.models.control import Control
from app.models.control_family import ControlFamily
from app.models.poam import POAMItem
from app.models.boundary_asset import BoundaryAsset
from app.services.sprs_calculator import SPRSCalculator

dashboard_bp = Blueprint('dashboard', __name__)

STATUS_COLORS = {
    'implemented': '#22c55e',
    'partially_implemented': '#f59e0b',
    'planned': '#3b82f6',
    'not_implemented': '#ef4444',
    'not_applicable': '#6b7280',
    'not_assessed': '#94a3b8',
}

STATUS_LABELS = {
    'implemented': 'Implemented',
    'partially_implemented': 'Partially Implemented',
    'planned': 'Planned',
    'not_implemented': 'Not Implemented',
    'not_applicable': 'Not Applicable',
    'not_assessed': 'Not Assessed',
}

RISK_COLORS = {
    'critical': '#dc2626',
    'high': '#ef4444',
    'moderate': '#f59e0b',
    'low': '#22c55e',
}


@dashboard_bp.route('', methods=['GET'])
def get_dashboard():
    session_id = request.args.get('session_id', '__default__')

    controls = Control.query.filter_by(session_id=session_id).all()
    families = ControlFamily.query.filter_by(session_id=session_id).all()
    poam_items = POAMItem.query.filter_by(session_id=session_id).all()
    boundary_assets = BoundaryAsset.query.filter_by(
        session_id=session_id, in_scope=1
    ).all()

    # SPRS score
    sprs_score = SPRSCalculator.calculate(controls=controls)

    # Total and assessed counts
    total_controls = len(controls)
    assessed_controls = sum(
        1 for c in controls if c.implementation_status != 'not_assessed'
    )

    # Implementation breakdown (Recharts-compatible)
    status_counts = {}
    for c in controls:
        s = c.implementation_status or 'not_assessed'
        status_counts[s] = status_counts.get(s, 0) + 1

    implementation_breakdown = []
    for status_key in [
        'implemented', 'partially_implemented', 'planned',
        'not_implemented', 'not_applicable', 'not_assessed'
    ]:
        count = status_counts.get(status_key, 0)
        if count > 0:
            implementation_breakdown.append({
                'name': STATUS_LABELS.get(status_key, status_key),
                'value': count,
                'color': STATUS_COLORS.get(status_key, '#6b7280'),
            })

    # Family heatmap (Recharts-compatible)
    family_control_map = {}
    for c in controls:
        if c.family_id not in family_control_map:
            family_control_map[c.family_id] = {'total': 0, 'implemented': 0}
        family_control_map[c.family_id]['total'] += 1
        if c.implementation_status == 'implemented':
            family_control_map[c.family_id]['implemented'] += 1

    family_heatmap = []
    for fam in sorted(families, key=lambda f: f.sort_order or 0):
        stats = family_control_map.get(fam.id, {'total': 0, 'implemented': 0})
        total = stats['total']
        impl = stats['implemented']
        pct = round((impl / total * 100) if total > 0 else 0)
        if pct >= 80:
            color = '#22c55e'
        elif pct >= 50:
            color = '#f59e0b'
        else:
            color = '#ef4444'

        family_heatmap.append({
            'name': fam.name,
            'code': fam.family_code,
            'total': total,
            'implemented': impl,
            'percentage': pct,
            'color': color,
        })

    # POA&M summary
    poam_total = len(poam_items)
    poam_open = sum(1 for p in poam_items if p.status == 'open')
    poam_in_progress = sum(1 for p in poam_items if p.status == 'in_progress')
    poam_overdue = sum(
        1 for p in poam_items
        if p.planned_completion_date and p.status in ('open', 'in_progress')
        and p.planned_completion_date < '2026-02-12'
    )

    risk_counts = {}
    for p in poam_items:
        rl = p.risk_level or 'moderate'
        risk_counts[rl] = risk_counts.get(rl, 0) + 1

    by_risk = []
    for risk_key in ['critical', 'high', 'moderate', 'low']:
        count = risk_counts.get(risk_key, 0)
        if count > 0:
            by_risk.append({
                'name': risk_key.capitalize(),
                'value': count,
                'color': RISK_COLORS.get(risk_key, '#6b7280'),
            })

    poam_summary = {
        'total': poam_total,
        'open': poam_open,
        'in_progress': poam_in_progress,
        'overdue': poam_overdue,
        'by_risk': by_risk,
    }

    # Boundary count
    boundary_count = len(boundary_assets)

    # Mock score trend (showing improvement over 6 months)
    score_trend = [
        {'name': 'Sep 2025', 'value': -85},
        {'name': 'Oct 2025', 'value': -62},
        {'name': 'Nov 2025', 'value': -48},
        {'name': 'Dec 2025', 'value': -35},
        {'name': 'Jan 2026', 'value': -28},
        {'name': 'Feb 2026', 'value': sprs_score},
    ]

    return jsonify({
        'sprs_score': sprs_score,
        'total_controls': total_controls,
        'assessed_controls': assessed_controls,
        'implementation_breakdown': implementation_breakdown,
        'family_heatmap': family_heatmap,
        'poam_summary': poam_summary,
        'boundary_count': boundary_count,
        'score_trend': score_trend,
    })
