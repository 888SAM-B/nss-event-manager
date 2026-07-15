const PeriodicalReport = require('../models/PeriodicalReport');
const Event = require('../models/Event');
const Unit = require('../models/Unit');
const User = require('../models/User');

const submitPeriodicalReport = async (req, res) => {
    if (req.user.role !== 'unit' && req.user.role !== 'college' && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    const { 
        unitCode, 
        collegeCode, 
        reportType, 
        month, 
        fromDate, 
        toDate, 
        periodLabel, 
        poDetails, 
        collegeDetails, 
        activities, 
        socialMedia 
    } = req.body;

    if (!unitCode || !collegeCode || !reportType || !fromDate || !toDate || !periodLabel) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
        const collegeObj = await User.findOne({ code: collegeCode });
        if (!collegeObj) return res.status(404).json({ success: false, message: "College not found" });

        const unitObj = await Unit.findOne({ unitNumber: unitCode, collegeId: collegeObj._id });
        if (!unitObj) return res.status(404).json({ success: false, message: "Unit not found" });

        // Check if there is an existing report for this unit and this specific period
        let existingReport = await PeriodicalReport.findOne({
            unitId: unitObj._id,
            reportType,
            periodLabel
        });

        if (existingReport) {
            existingReport.fromDate = fromDate;
            existingReport.toDate = toDate;
            existingReport.month = month || '';
            existingReport.poDetails = poDetails;
            existingReport.collegeDetails = collegeDetails;
            existingReport.activities = activities;
            existingReport.socialMedia = socialMedia;
            existingReport.submittedAt = new Date();
            await existingReport.save();
            return res.json({ success: true, message: "Report updated successfully", report: existingReport });
        } else {
            const newReport = new PeriodicalReport({
                unitId: unitObj._id,
                collegeId: collegeObj._id,
                reportType,
                month: month || '',
                fromDate,
                toDate,
                periodLabel,
                poDetails,
                collegeDetails,
                activities,
                socialMedia
            });
            await newReport.save();
            return res.json({ success: true, message: "Report submitted successfully", report: newReport });
        }
    } catch (error) {
        console.error("Error submitting report:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const getUnitPeriodicalReports = async (req, res) => {
    const { unitCode, collegeCode } = req.params;
    
    if (req.user.role === 'unit' && req.user.unitNumber !== unitCode) {
        return res.status(403).json({ success: false, message: "Unauthorized unit access" });
    }

    try {
        const collegeObj = await User.findOne({ code: collegeCode });
        if (!collegeObj) return res.status(404).json({ success: false, message: "College not found" });

        const unitObj = await Unit.findOne({ unitNumber: unitCode, collegeId: collegeObj._id });
        if (!unitObj) return res.status(404).json({ success: false, message: "Unit not found" });

        const reports = await PeriodicalReport.find({ unitId: unitObj._id }).sort({ submittedAt: -1 });
        res.json({ success: true, reports });
    } catch (error) {
        console.error("Error fetching reports:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const getUnitPeriodicalReportPrefill = async (req, res) => {
    const { unitCode, collegeCode, fromDate, toDate } = req.query;

    if (!unitCode || !collegeCode || !fromDate || !toDate) {
        return res.status(400).json({ success: false, message: "Missing query parameters" });
    }

    try {
        const collegeObj = await User.findOne({ code: collegeCode });
        if (!collegeObj) return res.status(404).json({ success: false, message: "College not found" });

        const unitObj = await Unit.findOne({ unitNumber: unitCode, collegeId: collegeObj._id });
        if (!unitObj) return res.status(404).json({ success: false, message: "Unit not found" });

        const events = await Event.find({
            $and: [
                {
                    unitId: unitObj._id,
                    isExternal: { $ne: true },
                    'report.submittedAt': { $exists: true, $ne: null }
                },
                {
                    $or: [
                        {
                            singleDay: true,
                            date: { $gte: fromDate, $lte: toDate }
                        },
                        {
                            singleDay: false,
                            dateFrom: { $lte: toDate },
                            dateTo: { $gte: fromDate }
                        }
                    ]
                }
            ]
        });

        const mapEventToActivity = (event) => {
            const category = (event.category || '').toLowerCase().trim();
            const name = (event.name || '').toLowerCase();
            const desc = (event.description || '').toLowerCase();

            if (category === 'blood donation' || name.includes('blood donation') || name.includes('blood camp')) {
                return 'blood_donation';
            }
            if (category === 'health' || category === 'health care' || name.includes('health camp') || name.includes('medical camp') || name.includes('health care')) {
                return 'health_camps';
            }
            if (category.includes('drug') || name.includes('anti drug') || name.includes('anti-drug') || desc.includes('anti drug') || desc.includes('anti-drug') || name.includes('narcotics')) {
                return 'anti_drug';
            }
            if ((name.includes('voter') || name.includes('elect')) && name.includes('sir')) {
                return 'voter_sir';
            }
            if ((name.includes('voter') || name.includes('elect') || name.includes('sveep')) && (name.includes('sveep') || desc.includes('sveep'))) {
                return 'voter_sveep';
            }
            if (category === 'road safety' || name.includes('road safety') || name.includes('traffic awareness') || name.includes('road safety patrol')) {
                return 'road_safety';
            }
            if (category === 'tree plantation' || name.includes('tree plantation') || name.includes('sapling') || name.includes('plantation')) {
                return 'tree_plantation';
            }
            if (category === 'important days' || name.includes('important day') || name.includes('celebration') || name.includes('anniversary') || name.includes('national youth day') || name.includes('nss day')) {
                return 'important_days';
            }
            if (category === 'pledge' || name.includes('pledge') || name.includes('oath')) {
                return 'pledge';
            }
            if (category === 'rallies' || category === 'rally' || name.includes('rally') || name.includes('rallies')) {
                return 'rallies';
            }
            if (category === 'conference' || category === 'seminar' || category === 'workshop' || name.includes('meeting') || name.includes('seminar') || name.includes('workshop')) {
                return 'hosted_meetings';
            }

            return 'any_other';
        };

        const activities = {
            blood_donation: { programmes: 0, volunteers: 0, bloodUnits: 0 },
            health_camps: { programmes: 0, volunteers: 0, beneficiaries: 0 },
            anti_drug: { programmes: 0, volunteers: 0, beneficiaries: 0 },
            voter_sir: { programmes: 0, volunteers: 0, beneficiaries: 0 },
            voter_sveep: { programmes: 0, volunteers: 0, beneficiaries: 0 },
            road_safety: { programmes: 0, volunteers: 0, beneficiaries: 0 },
            tree_plantation: { programmes: 0, volunteers: 0, saplings: 0 },
            important_days: { programmes: 0, volunteers: 0, date: "" },
            pledge: { programmes: 0, volunteers: 0 },
            rallies: { programmes: 0, volunteers: 0, date: "", distance: 0 },
            hosted_meetings: { programmes: 0, guestName: "", volunteers: 0, beneficiaries: 0 },
            any_other: { programmes: 0, colleges: 0, volunteers: 0, beneficiaries: 0, remarks: "" }
        };

        console.log(`[PREFILL DEBUG] unitCode=${unitCode} collegeCode=${collegeCode} from=${fromDate} to=${toDate}`);
        console.log(`[PREFILL DEBUG] unitObj._id=${unitObj._id} found ${events.length} events`);
        events.forEach(evt => {
            console.log(`  -> Event: "${evt.name}" | category="${evt.category}" | singleDay=${evt.singleDay} | date=${evt.date || ''} | dateFrom=${evt.dateFrom || ''} | dateTo=${evt.dateTo || ''} | submittedAt=${evt.report?.submittedAt} | treesPlanted=${evt.report?.treesPlanted} | bloodUnits=${evt.report?.bloodUnitsCollected} | volunteers=${evt.report?.volunteersParticipated}`);
        });

        events.forEach(evt => {
            const act = mapEventToActivity(evt);
            const reportData = evt.report || {};
            
            // volunteersParticipated is set = participantsCount on every report submit (no separate UI field)
            // Use participantsCount as primary source; volunteersParticipated as fallback for old records
            const volunteers = Number(reportData.participantsCount) || Number(reportData.volunteersParticipated) || 0;
            const beneficiaries = Number(reportData.beneficiariesCount) || 0;
            
            switch(act) {
                case 'blood_donation':
                    activities.blood_donation.programmes += 1;
                    activities.blood_donation.volunteers += volunteers;
                    activities.blood_donation.bloodUnits += Number(reportData.bloodUnitsCollected) || 0;
                    break;
                case 'health_camps':
                    activities.health_camps.programmes += 1;
                    activities.health_camps.volunteers += volunteers;
                    activities.health_camps.beneficiaries += beneficiaries;
                    break;
                case 'anti_drug':
                    activities.anti_drug.programmes += 1;
                    activities.anti_drug.volunteers += volunteers;
                    activities.anti_drug.beneficiaries += beneficiaries;
                    break;
                case 'voter_sir':
                    activities.voter_sir.programmes += 1;
                    activities.voter_sir.volunteers += volunteers;
                    activities.voter_sir.beneficiaries += beneficiaries;
                    break;
                case 'voter_sveep':
                    activities.voter_sveep.programmes += 1;
                    activities.voter_sveep.volunteers += volunteers;
                    activities.voter_sveep.beneficiaries += beneficiaries;
                    break;
                case 'road_safety':
                    activities.road_safety.programmes += 1;
                    activities.road_safety.volunteers += volunteers;
                    activities.road_safety.beneficiaries += beneficiaries;
                    break;
                case 'tree_plantation':
                    activities.tree_plantation.programmes += 1;
                    activities.tree_plantation.volunteers += volunteers;
                    activities.tree_plantation.saplings += Number(reportData.treesPlanted) || 0;
                    break;
                case 'important_days':
                    activities.important_days.programmes += 1;
                    activities.important_days.volunteers += volunteers;
                    if (!activities.important_days.date) {
                        activities.important_days.date = evt.singleDay ? evt.date : evt.dateFrom;
                    }
                    break;
                case 'pledge':
                    activities.pledge.programmes += 1;
                    activities.pledge.volunteers += volunteers;
                    break;
                case 'rallies':
                    activities.rallies.programmes += 1;
                    activities.rallies.volunteers += volunteers;
                    if (!activities.rallies.date) {
                        activities.rallies.date = evt.singleDay ? evt.date : evt.dateFrom;
                    }
                    // Use explicit rallyDistance field, fall back to regex on description
                    if (reportData.rallyDistance) {
                        activities.rallies.distance += Number(reportData.rallyDistance);
                    } else if (activities.rallies.distance === 0) {
                        const descMatch = (evt.description + ' ' + (reportData.outcome || '')).match(/(\d+(\.\d+)?)\s*km/i);
                        if (descMatch) {
                            activities.rallies.distance = parseFloat(descMatch[1]);
                        }
                    }
                    break;
                case 'hosted_meetings':
                    activities.hosted_meetings.programmes += 1;
                    activities.hosted_meetings.volunteers += volunteers;
                    activities.hosted_meetings.beneficiaries += beneficiaries;
                    if (reportData.guests && reportData.guests.length > 0) {
                        const guestList = reportData.guests.filter(g => g.trim() !== '').join(', ');
                        if (guestList) {
                            activities.hosted_meetings.guestName = activities.hosted_meetings.guestName 
                                ? activities.hosted_meetings.guestName + '; ' + guestList
                                : guestList;
                        }
                    }
                    break;
                default:
                    activities.any_other.programmes += 1;
                    activities.any_other.volunteers += volunteers;
                    activities.any_other.beneficiaries += beneficiaries;
                    activities.any_other.colleges += Number(reportData.collegesCount) || 1;
                    if (reportData.outcome) {
                        activities.any_other.remarks = activities.any_other.remarks
                            ? activities.any_other.remarks + '; ' + reportData.outcome
                            : reportData.outcome;
                    }
                    break;
            }
        });

        res.json({ success: true, activities });
    } catch (error) {
        console.error("Error fetching prefill data:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const getAdminPeriodicalReports = async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'nodal') {
        return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    const { collegeId, unitId, reportType, fromDate, toDate } = req.query;

    try {
        let query = {};
        if (collegeId) query.collegeId = collegeId;
        if (unitId) query.unitId = unitId;
        if (reportType) query.reportType = reportType;
        
        if (fromDate || toDate) {
            query.$or = [];
            if (fromDate && toDate) {
                query.fromDate = { $gte: fromDate };
                query.toDate = { $lte: toDate };
            } else if (fromDate) {
                query.fromDate = { $gte: fromDate };
            } else if (toDate) {
                query.toDate = { $lte: toDate };
            }
        }

        const reports = await PeriodicalReport.find(query)
            .populate('unitId', 'unitNumber name head')
            .populate('collegeId', 'insName code district')
            .sort({ submittedAt: -1 });

        res.json({ success: true, reports });
    } catch (error) {
        console.error("Error fetching admin reports:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const deletePeriodicalReport = async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'college' && req.user.role !== 'unit') {
        return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    const { id } = req.params;

    try {
        const report = await PeriodicalReport.findById(id);
        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }

        // Verify authorization
        if (req.user.role === 'unit') {
            const unit = await Unit.findById(report.unitId);
            if (!unit || unit.unitNumber !== req.user.unitNumber) {
                return res.status(403).json({ success: false, message: "Unauthorized deletion" });
            }
        } else if (req.user.role === 'college') {
            const college = await User.findById(report.collegeId);
            if (!college || college.userName !== req.user.userName) {
                return res.status(403).json({ success: false, message: "Unauthorized deletion" });
            }
        }

        await PeriodicalReport.findByIdAndDelete(id);
        res.json({ success: true, message: "Report deleted successfully" });
    } catch (error) {
        console.error("Error deleting report:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

module.exports = {
    submitPeriodicalReport,
    getUnitPeriodicalReports,
    getUnitPeriodicalReportPrefill,
    getAdminPeriodicalReports,
    deletePeriodicalReport
};
